const nextId = (current => () => ++current)(0)

module.exports = socket => {
  const active = {}

  socket.addMessageHandler(message => {
    const operation = active[message.id]
    operation.responseHandlers[message.status](message)
  })

  const executeOperation = (name, args) => new Promise((resolve, reject) => {
    const id = nextId()

    active[id] = { 
      id, 
      responseHandlers: {
        ok: message => {
          delete active[id]
          resolve(message.data)
        },
        error: ({ data }) => {
          delete active[id]
          reject(data)
        }
      }
    }

    socket.send.request(id, name, args)
  })

  return (name, args) => executeOperation(name, args)
}