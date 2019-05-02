module.exports = (options, messages, log) => {
  const queue = []
  let currentFlushPromise

  const api = {
    add: (command, socket) => {
      log.debug({ commandId: command.id }, `Enqueueing command`)
      queue.push(command)
      if(currentFlushPromise) {
        return currentFlushPromise
      } else if(socket) {
        return api.flush(socket)
      }
    },
    flush: (socket) => {
      if(queue.length > 0) {
        log.debug({ commandId: queue[0].id }, 'Dequeueing command')
        return currentFlushPromise = queue[0].trySend(socket, messages)
          .then(() => {
            queue.shift()
            return api.flush(socket)
          })
          .catch(() => { 
            // ignore errors as commands are self contained and we'll be retrying (?)
            // should probably add a delay and retry here, otherwise the queue stalls until next action?
          })
      } else {
        currentFlushPromise = undefined
      }
    },
    length: () => queue.length
  }

  return api
}