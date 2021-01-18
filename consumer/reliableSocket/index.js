const defaultSocketFactory = require('./defaultSocketFactory')
const commandModule = require('./command')
const reliableSendModule = require('./reliableSend')
const { fromEmitter, swappable } = require('@xest/core')

const defaultOptions = { 
  reconnectDelay: 500
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = (options, onConnect, serializer, log) => {
  options = { ...defaultOptions, ...options }
  log = log.child({ source: 'socket.consumer.reliableSocket'})

  let activeSocket
  const messages = swappable()
  const events = swappable()

  const { serialize, deserialize } = serializer
  const socketFactory = options.socketFactory || defaultSocketFactory(options)
  const reliableSend = reliableSendModule(options, messages, log)
  const commandFactory = commandModule(serializer, log)

  const connectNewSocket = () => {
    log.debug(`Connecting to ${options.url || 'host'}`)

    const socket = socketFactory()
    const addListener = (socket.on || socket.addEventListener).bind(socket)

    messages.swap(fromEmitter(socket, 'message').map(({ data }) => deserialize(data)))
    events.swap(fromEmitter(socket, 'open', 'close', 'error'))

    addListener('open', async () => {
      activeSocket = socket
      await onConnect()
      reliableSend.flush(activeSocket)
    })

    addListener('close', e => {
      log.debug(e, 'Socket closed')
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
    send: message => reliableSend.send(commandFactory(message), activeSocket)
  }
  api.send.immediate = message => activeSocket.send(serialize(message))

  connectNewSocket()

  return api
}