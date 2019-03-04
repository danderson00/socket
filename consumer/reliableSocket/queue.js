module.exports = (options, log) => {
  const queue = []
  let currentFlushPromise

  const api = {
    add: (command, socket, messages) => {
      log.trace(`Enqueueing command ID ${command.id}`)
      queue.push(command)
      if(currentFlushPromise) {
        return currentFlushPromise
      } else if(socket && messages) {
        return api.flush(socket, messages)
      }
    },
    flush: (socket, messages) => {
      if(queue.length > 0) {
        return currentFlushPromise = queue[0].trySend(socket, messages)
          .then(() => {
            queue.shift()
            return api.flush(socket, messages)
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