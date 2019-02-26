const sendWrapper = require('../sendWrapper')
const { proxy } = require('xest')

const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

const nextId = (id => () => ++id)(0)

module.exports = (messages, send, middleware) => ({
  create: (type, data) => {
    const id = nextId()

    return sessions[type](
      proxy(messages.where(x => x.sessionId === id)), // a tiny little leak here - the where component stays subscribed after the proxy is disconnected
      data, 
      sendWrapper(send, id),
      middleware
    )
  }
})
