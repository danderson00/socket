const sessions = require('./sessions')
const observables = require('./observables')
const xest = require('@x/expressions')
const uuid = require('uuid').v4

module.exports = ({ server, socket }, sessionFactory, serializer, log) => {
  const { serialize, deserialize } = serializer
  const source = server
    ? xest.fromEmitter(server, 'connection')
    : xest.subject()

  // this is rather nasty and needs to be refactored...
  const connections = source
    .map(socket => ({
      id: uuid(),
      messages: xest.fromEmitter(socket, 'message').map(message => {
        // websocket package returns payload in `data` property, child process does not - could be flaky!
        const deserialized = deserialize(message.data || message)
        if (deserialized.commandId) {
          safeSend(socket, { commandId: deserialized.commandId, status: 'ack' })
        }
        return deserialized
      }),
      events: xest.fromEmitter(socket, 'error', 'close'),
      send: message => safeSend(socket, message)
    }))
    .map(connection => ({ ...connection, observables: observables(connection) }))
    // the sessions module expects the observables property to be populated
    .map(connection => ({ ...connection, sessions: sessions(connection, sessionFactory) }))

  if(socket) {
    source.publish(socket)
  }

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