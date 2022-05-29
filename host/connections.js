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
  const disconnectCallbacks = []

  // just count connections for now - eventually maintain a list of active connections
  let connectionCount = 0

  // this needs refactoring... the order properties are attached is significant
  const connections = source
    .map(({ args: [socket, request] }) => {
      const connectionId = uuid()
      const connectionLog = log.child({ connectionId })
      const connection = {
        id: connectionId,
        log: connectionLog,
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
      }
      connection.observables = observables(connection)
      connection.sessions = sessions(connection, sessionFactory)
      connectCallbacks.forEach(callback => callback(connection))

      connectionLog.info('Connection established', { connectionCount: ++connectionCount })
      socket.on('close', () => {
        disconnectCallbacks.forEach(callback => callback(connection))
        connectionLog.info('Connection closed', { connectionCount: --connectionCount })
      })
      return connection
    })

  if(socket) {
    source.publish({ args: [socket] })
  }

  connections.registerConnectCallback = callback => connectCallbacks.push(callback)
  connections.registerDisconnectCallback = callback => disconnectCallbacks.push(callback)

  connections.add = socket => source.publish({ args: [socket] })

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