// socket wrapper encapsulating message serialization to / from JSON
// custom / binary serializers could be plugged in here

module.exports = socket => {
  const messageHandlers = []

  return {
    send: message => socket.send(JSON.stringify(message)),
    addMessageHandler: handler => {
      const injected = data => {
        try {
          handler(JSON.parse(data))
        } catch(error) {
          socket.send(JSON.stringify({ status: 'error', data: { message: "Socket data must be JSON" } }))
        }        
      }
      messageHandlers.push({ handler, injected })
      socket.addEventListener('message', injected)
    },
    removeMessageHandler: handler => {
      const entry = messageHandlers.find(x => x.handler === handler)
      socket.removeEventListener('message', entry.injected)
      messageHandlers.splice(messageHandlers.indexOf(entry), 1)
    },

    // use `on` for persistent subscriptions to arbitrary event types
    on: (type, listener) => socket.on(type, listener)
  }
}