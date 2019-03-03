module.exports = options => {
  const nextId = (next => () => ++next)(0)

  return message => {
    const commandId = nextId()
    return {
      trySend: (socket, messages) => new Promise((resolve, reject) => {
        try {
          socket.send(options.serializer.serialize({ ...message, commandId }))
          const subscription = messages.subscribe(message => {
            if(message && message.commandId === commandId) { 
              subscription.unsubscribe()
              if(message.status === 'ack') {
                resolve()
              } else {
                reject(new Error(message.message))
              }
            }
          })
          // timeout?
        } catch(error) {
          reject(error)
        }
      })
    }
  }
}