const sessions = require('./sessions')
const observables = require('./observables')
const expressions = require('@x/expressions')
const uuid = require('uuid').v4

module.exports = ({ server, socket }, sessionFactory, serializer, log) => {
  const { serialize, deserialize } = serializer
  const source = server
    ? expressions.fromEmitter(server, 'connection')
    : expressions.subject()
  const connectCallbacks = []

  // this is rather nasty and needs to be refactored...
  const connections = source
    .map(({ args: [socket, request] }) => ({
      id: uuid(),
      socket,
      request,
      messages: expressions.fromEmitter(socket, 'message').map(({ data: message }) => {
        // websocket package returns payload in `data` property, child process does not - could be flaky!
        const deserialized = deserialize(message.data || message)
        if (deserialized.commandId) {
          safeSend(socket, { commandId: deserialized.commandId, status: 'ack' })
        }
        return deserialized
      }),
      events: expressions.fromEmitter(socket, 'error', 'close'),
      send: message => safeSend(socket, message)
    }))
      .map(connection => ({ ...connection, observables: observables(connection) }))
      .map(connection => {
        // this is the nastiest - needs to be the same instance that is exposed to middleware...
        connectCallbacks.forEach(callback => callback(connection))
        return { ...connection, sessions: sessions(connection, sessionFactory) }
      })

  if(socket) {
    source.publish(socket)
  }

  connections.registerConnectCallback = callback => connectCallbacks.push(callback)

  return connections

  function safeSend(socket, message) {
    try {
      log.debug('Sending message', message)
      return socket.send(serialize(message))
    } catch(error) {
      log.error(error, `Error sending message to socket`)
    }
  }
}