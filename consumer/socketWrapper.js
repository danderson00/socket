const { fromEmitter, swappable } = require('@x/expressions')

module.exports = (options, onConnect, serializer, log) => {
  log = log.child({ source: 'socket.consumer.socketWrapper'})

  const socket = options.socket
  const messages = swappable()
  const events = swappable()

  const { serialize, deserialize } = serializer

  const addListener = (socket.on || socket.addEventListener).bind(socket)

  // websocket package returns payload in `data` property, child process does not - could be flaky!
  messages.swap(fromEmitter(socket, 'message').map(message => deserialize(message.data || message)))
  events.swap(fromEmitter(socket, 'open', 'close', 'error'))

  addListener('close', e => log.debug(e, 'Socket closed'))
  addListener('error', error => log.debug(error, 'Socket error'))

  onConnect()

  const send = message => socket.send(serialize(message))

  const api = {
    messages,
    events,
    send
  }
  api.send.immediate = send

  return api
}