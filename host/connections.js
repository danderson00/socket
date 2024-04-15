const sessions = require('./sessions')
const observables = require('./observables')
const observable = require('@x/observable')
const uuid = require('../common/uuid')
const { sources } = require('../common/constants')
const cancellable = require('./utilities/cancellableTimeout')

module.exports = ({ server, socket }, sessionFactory, serializer, log, options) => {
  const { subject, merge, fromEmitter } = observable
  const { handshakeTimeout } = options
  const { serialize, deserialize } = serializer
  const sideSource = subject()
  const source = server
    ? merge(fromEmitter(server, 'connection'), sideSource)
    : sideSource

  const connectCallbacks = []
  const disconnectCallbacks = []

  // just count connections for now - eventually maintain a list of active connections
  let connectionCount = 0

  // this needs refactoring... the order properties are attached is significant
  source.subscribe(({ args: [socket, request] }) => {
    const connectionId = uuid()
    const connectionLog = log.child({ connectionId, clientIp: request.headers['x-forwarded-for'] })
    const connection = {
      id: connectionId,
      log: connectionLog,
      socket,
      request,
      disconnect: code => socket.close(code),
      messages: observable(publish => {
        const subscription = fromEmitter(socket, 'message').subscribe(({ data: message }) => {
          const payload = safeDeserialize(message)
          if(payload?.src === sources.CONSUMER) {
            if(payload.commandId) {
              safeSend(socket, { commandId: payload.commandId, status: 'ack' })
            }
            publish(payload)
          }
        })

        return () => subscription.unsubscribe()
      }),
      events: fromEmitter(socket, 'error', 'close'),
      send: message => safeSend(socket, message)
    }
    connection.observables = observables(connection)
    connection.sessions = sessions(connection, sessionFactory)
    connection.disconnectTimeout = cancellable(connection.disconnect, handshakeTimeout)
    connectCallbacks.forEach(callback => callback(connection))

    connectionLog.info('Connection established', { connectionCount: ++connectionCount })
    socket.on('close', () => {
      disconnectCallbacks.forEach(callback => callback(connection))
      connectionLog.info('Connection closed', { connectionCount: --connectionCount })
    })

    function safeDeserialize(message) {
      try {
        return deserialize(message.data || message)
      } catch (error) {
        connectionLog.warn('Malformed message', error)
      }
    }
  })

  if(socket) {
    sideSource.publish({ args: [socket] })
  }

  return {
    registerConnectCallback: callback => connectCallbacks.push(callback),
    registerDisconnectCallback: callback => disconnectCallbacks.push(callback),
    add: socket => sideSource.publish({ args: [socket] }),
    count: () => connectionCount
  }

  function safeSend(socket, message) {
    try {
      log.debug('Sending message', message)
      return socket.send(serialize({ ...message, src: sources.HOST }))
    } catch(error) {
      log.error(error, `Error sending message to socket`)
    }
  }
}