const defaultOptions = { interval: 30000 }

module.exports = options => ({ log }) => ({
  name: 'heartbeat',
  initialise: ({ api }) => {
    const { interval } = { ...defaultOptions, ...options }

    const createTimer = target => {
      const handle = setInterval(() => {
        try {
          Promise.resolve(target())
            .then(() => {})
            .catch(error => log.error('Error calling heartbeat', error))
        } catch(error) {
          log.error('Error calling heartbeat', error)
        }
      }, interval)
      return {
        stop: () => {
          clearInterval(handle)
        }
      }
    }

    let timer = createTimer(api.heartbeat)

    return {
      disconnect: timer.stop,
      reconnect: ({ api }) => timer = createTimer(api.heartbeat)
    }
  }
})
