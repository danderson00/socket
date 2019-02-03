const sendWrapper = require('./sendWrapper')
const nextId = (id => () => ++id)(0)

module.exports = (socket, sessionFactory, { serialize, deserialize }) => {
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
        const context = {
          send: sendWrapper(serialize, socket, id),
          terminate: delete sessions[id]
        }

        sessions[id] = sessionFactory.create('operation', { operation, parameters: Array.from(arguments) }, context)
        return sessions[id].responsePromise
      }
    }
    return operations.reduce((api, operation) => ({ ...api, [operation.name]: executeOperation(operation.name) }), {})
  })
}