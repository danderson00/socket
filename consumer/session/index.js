const sendWrapper = require('../sendWrapper')
const { proxy } = require('xest')

const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

const nextId = (id => () => ++id)(0)

module.exports = (messages, send) => ({
  create: (type, parameters) => {
    const id = nextId()

    return sessions[type](
      proxy(messages.where(x => x.sessionId === id)), // bit of a leak here
      parameters, 
      sendWrapper(send, id)
    )
  }
})
