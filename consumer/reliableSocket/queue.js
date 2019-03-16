module.exports = (options, messages, log) => {
  const queue = []
  let currentFlushPromise

  const api = {
    add: (command, socket) => {
      log.trace({ commandId: command.id }, `Enqueueing command`)
      queue.push(command)
      if(currentFlushPromise) {
        return currentFlushPromise
      } else if(socket) {
        return api.flush(socket)
      }
    },
    flush: (socket) => {
      if(queue.length > 0) {
        log.trace({ commandId: queue[0].id }, 'Dequeueing command')
        return currentFlushPromise = queue[0].trySend(socket, messages)
          .then(() => {
            queue.shift()
            return api.flush(socket)
          })
          .catch(() => { /* ignore errors as commands are self contained and we'll be retrying (?) */ })
      } else {
        currentFlushPromise = undefined
      }
    },
    length: () => queue.length
  }

  return api
}