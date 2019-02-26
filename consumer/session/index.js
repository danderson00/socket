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
      proxy(messages.where(x => x.sessionId === id)), // a tiny little leak here - the where component stays subscribed after the proxy is disconnected
      parameters, 
      sendWrapper(send, id)
    )
  }
})
