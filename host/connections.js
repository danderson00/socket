const sessions = require('./sessions')
const observables = require('./observables')
const expressions = require('@x/expressions')
const uuid = require('uuid').v4
const { sources } = require('../common/constants')

module.exports = ({ server, socket }, sessionFactory, serializer, log) => {
  const { serialize, deserialize } = serializer
  const sideSource = expressions.subject()
  const source = server
    ? expressions.merge(expressions.fromEmitter(server, 'connection'), sideSource)
    : sideSource

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
        messages: expressions.fromEmitter(socket, 'message')
          .map(({ data: message }) => {
            try {
              return deserialize(message.data || message)
            } catch(error) {
              log.warn('Malformed message', error)
            }
          })
          .filter(payload => payload && payload.src === sources.CONSUMER)
          .tap(payload => {
            if(payload.commandId) {
              safeSend(socket, { commandId: payload.commandId, status: 'ack' })
            }
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
    sideSource.publish({ args: [socket] })
  }

  connections.registerConnectCallback = callback => connectCallbacks.push(callback)
  connections.registerDisconnectCallback = callback => disconnectCallbacks.push(callback)

  connections.add = socket => sideSource.publish({ args: [socket] })

  return connections

  function safeSend(socket, message) {
    try {
      log.debug('Sending message', message)
      return socket.send(serialize({ ...message, src: sources.HOST }))
    } catch(error) {
      log.error(error, `Error sending message to socket`)
    }
  }
}