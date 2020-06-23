module.exports = (options, log) => {
  const nextId = (next => () => ++next)(0)

  return message => {
    const id = nextId()
    log = log.child({ commandId: id })
    return {
      id,
      trySend: (socket, messages) => new Promise((resolve, reject) => {
        try {
          log.debug({ data: message }, `Sending command`)
          socket.send(options.serializer.serialize({ ...message, commandId: id }))
          
          const subscription = messages.where(x => x.commandId === id).subscribe(message => {
            subscription.unsubscribe()
            if(message.status === 'ack') {
              log.debug(`Received ack`)
              resolve()
            } else {
              log.debug(message.message, `Received error`)
              reject(new Error(message.message))
            }
          })
          // timeout?
        } catch(error) {
          log.debug(`Error sending command`)
          reject(error)
        }
      })
    }
  }
}