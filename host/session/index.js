const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = hostApi => ({
  create: (sessionObservable, send) => {
    const { type, id } = sessionObservable()

    if(sessions[type]) {
      const context = {
        id,
        send,
        disconnect: sessionObservable.disconnect,
        hostApi
      }
      try {
        return Promise.resolve(sessions[type](sessionObservable, context))
          .catch(error => {
            send.error(error)
            sessionObservable.disconnect()
          })
      } catch({ message }) {
        send.error(message)
        sessionObservable.disconnect()
      }
    } else {
      send.error(`No session type '${type}'`)
      sessionObservable.disconnect()
    }
  }
})