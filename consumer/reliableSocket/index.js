const defaultSocketFactory = require('./defaultSocketFactory')
const commandModule = require('./command')
const reliableSendModule = require('./reliableSend')
const { fromEmitter, swappable, mapObservable, filterObservable } = require('@x/observable')

const defaultOptions = { 
  reconnectDelay: 500
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = (userOptions, onConnect, onDisconnect, serializer, log) => {
  const options = { ...defaultOptions, ...userOptions }
  log = log.child({ source: 'socket.consumer.reliableSocket'})

  let activeSocket
  const messages = swappable()
  const events = swappable()

  const { serialize, deserialize } = serializer
  const socketFactory = options.socketFactory || defaultSocketFactory(options)
  const reliableSend = reliableSendModule(options, messages, log)
  const commandFactory = commandModule(serializer, log)

  const connectNewSocket = async initial => {
    log.debug(`Connecting to ${options.url || 'host'}`)

    const socket = await socketFactory()
    const addListener = (socket.on || socket.addEventListener).bind(socket)

    messages.swap(filterObservable(
      mapObservable(
        fromEmitter(socket, 'message'),
        ({ data }) => deserialize(data.data || data)
      ),
      payload => payload.src === 2
    ))
    events.swap(fromEmitter(socket, 'open', 'close', 'error'))

    addListener('open', async () => {
      activeSocket = socket
      await onConnect({ reconnect: !initial })
      reliableSend.flush(activeSocket)
    })

    addListener('close', async e => {
      log.debug(e, 'Socket closed')
      activeSocket = undefined
      await onDisconnect()
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
    send: message => reliableSend.send(commandFactory({ ...message, src: 1 }), activeSocket)
  }
  api.send.immediate = message => activeSocket.send(serialize({ ...message, src: 1 }))

  connectNewSocket(true).catch(error => log.debug(error, 'Socket error'))

  return api
}