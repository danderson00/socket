const defaultSocketFactory = require('./defaultSocketFactory')
const commandModule = require('./command')
const queueModule = require('./queue')
const swappable = require('../swappableObservable')
const serializerModule = require('../../common/serializer')
const { fromEmitter } = require('xest')

const defaultOptions = { 
  reconnectTimeout: 1000,
  serializer: serializerModule()
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = (options) => {
  options = { ...defaultOptions, ...options }
  const { deserialize } = options.serializer
  const socketFactory = options.socketFactory || defaultSocketFactory(options)
  const queue = queueModule(options)
  const commandFactory = commandModule(options)

  const connectNewSocket = () => {
    const socket = socketFactory()
    const messages = fromEmitter(socket, 'message').map(({ data }) => deserialize(data))
    const events = fromEmitter(socket, 'error', 'close')
    const addListener = (socket.on || socket.addEventListener).bind(socket)

    addListener('open', () => {
      api.messages.swap(messages)
      api.events.swap(events)
      api.send = message => queue.add(commandFactory(message), socket, messages)
      queue.flush(socket, messages)
    })

    addListener('close', () => delay(options.reconnectTimeout).then(connectNewSocket))
    // addListener('error', () => delay(options.reconnectTimeout).then(connectNewSocket))
  }

  const api = {
    messages: swappable(),
    events: swappable(),
    send: message => queue.add(commandFactory(message))
  }

  connectNewSocket()

  return api
}