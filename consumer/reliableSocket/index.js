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
  const { deserialize } = options.serializer
  const socketFactory = options.socketFactory || defaultSocketFactory(options)
  const queue = queueModule(options, log)
  const commandFactory = commandModule(options, log)

  const queueMessage = (socket, messages) => message => queue.add(commandFactory(message), socket, messages)

  const connectNewSocket = () => {
    log.info(`Connecting to ${options.url || 'host'}`)
    const socket = socketFactory()
    const messages = fromEmitter(socket, 'message').map(({ data }) => deserialize(data))
    const events = fromEmitter(socket, 'open', 'close', 'error')
    const addListener = (socket.on || socket.addEventListener).bind(socket)

    addListener('open', async () => {
      api.messages.swap(messages)
      api.events.swap(events)
      await onConnect()         
      api.send = queueMessage(socket, messages)
      queue.flush(socket, messages)
    })

    addListener('close', ({ code, reason }) => {
      log.debug({ code, reason }, `Socket closed`)
      api.send = queueMessage()
      delay(options.reconnectDelay).then(connectNewSocket)
    })

    addListener('error', error => log.debug(error, 'Socket error'))

    // TODO: add connect timeout
  }

  const api = {
    messages: swappable(),
    events: swappable(),
    send: queueMessage()
  }

  connectNewSocket()

  return api
}