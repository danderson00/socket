const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = hostApi => ({
  create: (message, send, terminate) => {
    if(sessions[message.type]) {
      const context = {
        id: message.id,
        send,
        terminate,
        hostApi
      }
      try {
        return sessions[message.type](message, context)
      } catch({ message }) {
        send({ status: 'error', session: 'terminate', data: { message } })
        terminate()
      }
    } else {
      send({ status: 'error', session: 'terminate', data: { message: `No session type '${message.type}'` } })
      terminate()
    }
  }
})