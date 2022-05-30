const { fromEmitter, swappable, filterObservable, mapObservable } = require('@x/observable')

module.exports = (options, onConnect, onDisconnect, serializer, log) => {
  log = log.child({ source: 'socket.consumer.socketWrapper'})

  const socket = options.socket
  const messages = swappable()
  const events = swappable()

  const { serialize, deserialize } = serializer

  const addListener = (socket.on || socket.addEventListener).bind(socket)

  messages.swap(filterObservable(
    mapObservable(
      fromEmitter(socket, 'message'),
      ({ data }) => deserialize(data.data || data)
    ),
    payload => payload.src === 2
  ))
  events.swap(fromEmitter(socket, 'open', 'close', 'error'))

  addListener('close', e => {
    onDisconnect()
    log.debug(e, 'Socket closed')
  })
  addListener('error', error => log.debug(error, 'Socket error'))

  onConnect({ reconnect: false })

  const send = message => socket.send(serialize({ ...message, src: 1 }))

  const api = {
    messages,
    events,
    send
  }
  api.send.immediate = send

  return api
}