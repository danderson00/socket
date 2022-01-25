module.exports = (serializer, log) => {
  const nextId = (next => () => ++next)(0)

  return message => {
    const id = nextId()
    log = log.child({ commandId: id })
    return {
      id,
      trySend: (socket, messages) => new Promise((resolve, reject) => {
        try {
          log.debug({ data: message }, `Sending command`)
          socket.send(serializer.serialize({ ...message, commandId: id }))
          
          const subscription = messages.subscribe(message => {
            if(message.commandId === id) {
              subscription.unsubscribe()
              if (message.status === 'ack') {
                log.debug(`Received ack`)
                resolve()
              } else {
                log.debug(message.message, `Received error`)
                reject(new Error(message.message))
              }
            }
          })
          // TODO: add timeout?
        } catch(error) {
          log.debug(`Error sending command`)
          reject(error)
        }
      })
    }
  }
}