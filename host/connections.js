const sessions = require('./sessions')
const xest = require('xest')
const uuid = require('uuid').v4

module.exports = (server, sessionFactory, { serialize, deserialize }, log) => {  
  const source = xest.fromEmitter(server, 'connection')
  const result = source
    .map(socket => ({ 
      id: uuid(), 
      messages: xest.fromEmitter(socket, 'message').map(message => {
        const deserialized = deserialize(message.data)
        if(deserialized.commandId) {
          safeSend(socket, { commandId: deserialized.commandId, status: 'ack' })
        }
        return deserialized
      }),
      events: xest.fromEmitter(socket, 'error', 'close'),
      send: message => safeSend(socket, message)
    }))
    .groupBy(
      'id',
      o => o.map(connection => ({
        ...connection,
        sessions: sessions(connection, sessionFactory)
      })
    )
  )
  result.disconnect = source.disconnect
  return result

  function safeSend(socket, message) {
    try {
      return socket.send(serialize(message))
    } catch(error) {
      log.error(error, `Error sending message to socket`)
    }
  }
}