const defaultOptions = { timeout: 1000 }

module.exports = (options, messages, log) => {
  options = { ...defaultOptions, ...options }

  const inFlightCommands = []

  const commandPromise = (command, initialSocket) => {
    let retry

    const promise = new Promise(resolve => {
      let currentAttempt
      let currentTimeout

      const trySend = retry = socket => {
        if(!currentAttempt) {
          clearTimeout(currentTimeout)

          if(!socket) {
            // if we have no socket, we probably haven't connected yet
            // wait until retry is explicitly called with a new socket
            return
          }

          currentAttempt = command.trySend(socket, messages)
            .then(result => resolve(result))
            .catch(error => {
              log.error(`Error sending command ${command.id}`, error)
              currentAttempt = undefined
              currentTimeout = setTimeout(() => trySend(socket), options.timeout)
            })
        }
      }

      trySend(initialSocket)
    })

    return { promise, retry }
  }

  const api = {
    send: (command, socket) => {
      const inFlight = commandPromise(command, socket)
      inFlightCommands.push(inFlight)
      inFlight.promise.then(() => inFlightCommands.splice(inFlightCommands.indexOf(inFlight)))
      return inFlight.promise
    },
    flush: socket => inFlightCommands.forEach(x => x.retry(socket)),
    length: () => inFlightCommands.length
  }

  return api
}