const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = (hostApi, parentLog, options) => {
  const handshakeCallbacks = {}

  return {
    addHandshake: (name, callback) => {
      if(name && callback) {
        handshakeCallbacks[name] = callback
      }
    },
    create: (sessionObservable, send, connection) => {
      const { type, sessionId } = sessionObservable()
      let disconnected = false
      const log = connection.log.child({ sessionId })

      if (sessions[type]) {
        const context = {
          id: sessionId,
          send,
          connection,
          disconnect,
          hostApi,
          log,
          handshakeCallbacks
        }

        try {
          return Promise.resolve(sessions[type](sessionObservable, context, options))
            .catch(handleError)
        } catch (error) {
          handleError(error)
        }
      } else {
        handleError(`No session type '${type}'`)
      }

      // trying to catch some unruly code disconnecting stuff more than once...
      function disconnect() {
        if (disconnected) {
          log.warn(`Attempt to disconnect already disconnected session`)
        } else {
          log.debug(`Disconnecting session`)
          sessionObservable.disconnect()
          disconnected = true
        }
      }

      function handleError(message) {
        log.error(message)
        send.error(message)
        disconnect()
      }
    }
  }
}