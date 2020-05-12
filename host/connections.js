const sessions = require('./sessions')
const xest = require('@xest/core')
const uuid = require('uuid').v4

module.exports = (server, sessionFactory, serializer, log) => {
  const { serialize, deserialize } = serializer
  const source = xest.fromEmitter(server, 'connection')
  const result = source
    .map(socket => {
      const connection = {
        id: uuid(),
        messages: xest.fromEmitter(socket, 'message').map(message => {
          const deserialized = deserialize(message.data)
          if (deserialized.commandId) {
            safeSend(socket, { commandId: deserialized.commandId, status: 'ack' })
          }
          return deserialized
        }),
        events: xest.fromEmitter(socket, 'error', 'close'),
        send: message => safeSend(socket, message)
      }

      return connection
    })
    .map(connection => ({
      ...connection,
      sessions: sessions(connection, sessionFactory)
    }))
    // .groupBy(
    //   'id'
    // )

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