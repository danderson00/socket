const nextId = (current => () => ++current)(0)

module.exports = operations => {
  const active = {}

  const executeOperation = (name, args) => new Promise((resolve, reject) => {
    const id = nextId()

    active[id] = { 
      id, 
      responseHandlers: {
        ok: message => resolve(message.data),
        error: ({ data }) => reject(data)
      }
    }
    socket.send(JSON.stringify({
      id,
      operation: name,
      arguments: args
    }))
  })

  return {
    initiate: (name, args) => executeOperation(name, args),
    handleMessage: message => {
      const operation = active[message.id]
      operation.responseHandlers[message.status](message)
    }
  }
}