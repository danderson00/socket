const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = (executor, log) => ({
  create: (sessionObservable, send, connection) => {
    const { type, id } = sessionObservable()

    if(sessions[type]) {
      const context = {
        id,
        send,
        connection,
        disconnect: sessionObservable.disconnect,
        hostApi: executor,
        log
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