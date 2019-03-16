const defaultSocketFactory = require('./defaultSocketFactory')
const commandModule = require('./command')
const queueModule = require('./queue')
const swappable = require('./swappableObservable')
const serializerModule = require('../../common/serializer')
const { fromEmitter } = require('xest')

const defaultOptions = { 
  reconnectDelay: 1000,
  serializer: serializerModule()
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = (options, onConnect, log) => {
  options = { ...defaultOptions, ...options }

  let activeSocket
  const messages = swappable()
  const events = swappable()

  const { serialize, deserialize } = options.serializer
  const socketFactory = options.socketFactory || defaultSocketFactory(options)
  const queue = queueModule(options, messages, log)
  const commandFactory = commandModule(options, log)

  const connectNewSocket = () => {
    log.info(`Connecting to ${options.url || 'host'}`)

    const socket = socketFactory()
    const addListener = (socket.on || socket.addEventListener).bind(socket)

    messages.swap(fromEmitter(socket, 'message').map(({ data }) => deserialize(data)))
    events.swap(fromEmitter(socket, 'open', 'close', 'error'))

    addListener('open', async () => {
      activeSocket = socket
      await onConnect()
      queue.flush(activeSocket)
    })

    addListener('close', ({ code, reason }) => {
      log.debug({ code, reason }, 'Socket closed')
      activeSocket = undefined
      delay(options.reconnectDelay).then(connectNewSocket)
    })

    addListener('error', error => {
      log.debug(error, 'Socket error')
      activeSocket = undefined
    })

    // TODO: add connect timeout
  }

  const api = {
    messages,
    events,
    send: message => queue.add(commandFactory(message), activeSocket),
    sendImmediate: message => activeSocket.send(serialize(message))
  }

  connectNewSocket()

  return api
}