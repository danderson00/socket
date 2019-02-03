const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = (hostApi, responseTypes) => ({
  create: (message, send, terminate) => {
    if(sessions[message.type]) {
      const context = {
        id: message.id,
        send,
        terminate,
        hostApi,
        responseTypes
      }
      try {
        return sessions[message.type](message, context)
      } catch({ message }) {
        send.error(message)
        terminate()
      }
    } else {
      send.error(`No session type '${message.type}'`)
      terminate()
    }
  }
})