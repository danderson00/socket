const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = (hostApi, parentLog) => ({
  create: (sessionObservable, send, connection) => {
    const { type, sessionId } = sessionObservable()
    let disconnected = false
    const log = parentLog.child({ sessionId })

    const eventSubscription = connection.events.subscribe(({ topic, data }) => {
      if(topic === 'error') {
        handleError(data)
      } else if(topic === 'close') {
        disconnect()
      }
    })

    if(sessions[type]) {
      const context = {
        id: sessionId,
        send,
        connection,
        disconnect,
        hostApi,
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

    // trying to catch some unruly code disconnecting stuff more than once...
    function disconnect() {
      if(disconnected) {
        log.warn(`Attempt to disconnect already disconnected session`)
      } else {
        log.trace(`Disconnecting session`)
        sessionObservable.disconnect()
        eventSubscription.unsubscribe()
        disconnected = true
      }
    }

    function handleError(message) {
      log.error(message)
      send.error(message)
      disconnect()
    }
  }
})