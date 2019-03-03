module.exports = options => {
  const queue = []

  const api = {
    add: (command, socket, messages) => {
      queue.push(command)
      if(socket && messages) {
        return api.flush(socket, messages)
      }
    },
    flush: (socket, messages) => {
      if(queue.length > 0) {
        return queue[0].trySend(socket, messages)
          .then(() => {
            queue.shift()
            return api.flush(socket, messages)
          })
          .catch(() => { /* ignore errors as commands are self contained and we'll be retrying (?) */ })
      }
    },
    length: () => queue.length
  }

  return api
}