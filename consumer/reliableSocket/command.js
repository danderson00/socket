module.exports = (options, log) => {
  const nextId = (next => () => ++next)(0)

  return message => {
    const id = nextId()
    return {
      id,
      trySend: (socket, messages) => new Promise((resolve, reject) => {
        try {
          log.trace(`Sending command ID ${id} - ${JSON.stringify(message)}`)
          socket.send(options.serializer.serialize({ ...message, commandId: id }))
          const subscription = messages.subscribe(message => {
            if(message && message.commandId === id) { 
              subscription.unsubscribe()
              if(message.status === 'ack') {
                log.trace(`Received ack for command ID ${id}`)
                resolve()
              } else {
                log.trace(`Received error for command ID ${id} - ${message.message || 'unknown error'}`)
                reject(new Error(message.message))
              }
            }
          })
          // timeout?
        } catch(error) {
          log.trace(`Error sending command ID ${id}`)
          reject(error)
        }
      })
    }
  }
}