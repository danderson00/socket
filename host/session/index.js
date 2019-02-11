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
          .catch(handleError)
      } catch(error) {
        handleError(error)
      }
    } else {
      handleError(`No session type '${type}'`)
    }

    function handleError(message) {
      send.error(message)
      sessionObservable.disconnect()
    }
  }
})