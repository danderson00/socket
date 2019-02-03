const sendWrapper = require('./sendWrapper')

module.exports = (socket, sessionFactory, { serialize, deserialize }, responseTypes) => {
  const nextId = (id => () => ++id)(0)

  const sessions = {
    // initiate handshake here for now
    // soon we'll need the ability to handshake again 
    // after reconnect with extra data
    handshake: sessionFactory.create(
      'handshake', 
      null, 
      { send: sendWrapper(serialize, socket, 'handshake') }
    )
  }

  const messageHandler = ({ data }) => {
    const message = deserialize(data)

    const session = sessions[message.id]
    if(session) {
      if(session.messageHandler) {
        session.messageHandler(message)
      }

      if(message.session === 'terminate') {
        delete sessions[message.id]
      }
      
    } else {
      throw new Error(`No active session with ID ${message.id}`)
    }
  }

  socket.addEventListener('message', messageHandler)

  return sessions.handshake.responsePromise.then(({ operations }) => {
    const executeOperation = operation => {
      return function () {
        const id = nextId()
        const send = sendWrapper(serialize, socket, id)
        const context = {
          send,
          terminate: () => {
            send.terminate()
            delete sessions[id]
          },
          responseTypes
        }

        sessions[id] = sessionFactory.create('operation', { operation, parameters: Array.from(arguments) }, context)
        return sessions[id].responsePromise
      }
    }
    return operations.reduce((api, operation) => ({ ...api, [operation.name]: executeOperation(operation.name) }), {})
  })
}