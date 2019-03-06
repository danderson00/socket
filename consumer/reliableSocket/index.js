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

module.exports = (options, log) => {
  options = { ...defaultOptions, ...options }
  const { deserialize } = options.serializer
  const socketFactory = options.socketFactory || defaultSocketFactory(options)
  const queue = queueModule(options, log)
  const commandFactory = commandModule(options, log)

  const connectNewSocket = () => {
    log.info(`Connecting to ${options.url || 'host'}`)
    const socket = socketFactory()
    const messages = fromEmitter(socket, 'message').map(({ data }) => deserialize(data))
    const events = fromEmitter(socket, 'open', 'close', 'error')
    const addListener = (socket.on || socket.addEventListener).bind(socket)

    addListener('open', () => {
      api.messages.swap(messages)
      api.events.swap(events)
      api.send = message => queue.add(commandFactory(message), socket, messages)
      queue.flush(socket, messages)
    })

    addListener('close', ({ code, reason }) => {
      log.debug({ code, reason }, `Socket closed`)
      delay(options.reconnectDelay).then(connectNewSocket)
    })

    addListener('error', error => log.debug(error, 'Socket error'))

    // TODO: add connect timeout
  }

  const api = {
    messages: swappable(),
    events: swappable(),
    send: message => queue.add(commandFactory(message))
  }

  connectNewSocket()

  return api
}