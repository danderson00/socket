module.exports = (options, log) => {
  const nextId = (next => () => ++next)(0)

  return message => {
    const id = nextId()
    log = log.child({ commandId: id })
    return {
      id,
      trySend: (socket, messages) => new Promise((resolve, reject) => {
        try {
          log.trace({ data: JSON.stringify(message) }, `Sending command`)
          socket.send(options.serializer.serialize({ ...message, commandId: id }))
          const subscription = messages.subscribe(message => {
            if(message && message.commandId === id) { 
              subscription.unsubscribe()
              if(message.status === 'ack') {
                log.trace(`Received ack`)
                resolve()
              } else {
                log.trace(message.message, `Received error`)
                reject(new Error(message.message))
              }
            }
          })
          // timeout?
        } catch(error) {
          log.trace(`Error sending command`)
          reject(error)
        }
      })
    }
  }
}