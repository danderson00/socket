const sessions = require('./sessions')
const xest = require('xest')
const uuid = require('uuid').v4

module.exports = (server, sessionFactory, { serialize, deserialize }, log) => {
  const source = xest.fromEmitter(server, 'connection')
  const result = source
    .map(socket => ({ 
      id: uuid(), 
      messages: xest.fromEmitter(socket, 'message').map(message => deserialize(message.data)),
      events: xest.fromEmitter(socket, 'error', 'close'),
      send: message => socket.send(serialize(message))
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
}