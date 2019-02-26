const connect = require('./connect')
const sessionFactory = require('./session')
const middlewareModule = require('../common/middleware')
const serializer = require('../common/serializer')
const { fromEmitter } = require('xest')

module.exports = (socket, options = {}) => {
  const { serialize, deserialize } = serializer()
  const middleware = middlewareModule()

  const chainable = target => (...args) => {
    target.apply(null, args)
    return consumer
  }

  const consumer = {
    use: chainable(middleware.add),
    connect: () => new Promise((resolve, reject) => {
      const initialize = () => {
        const messages = fromEmitter(socket, 'message').map(({ data }) => deserialize(data))
        const events = fromEmitter(socket, 'error', 'close')
        const send = message => socket.send(serialize(message))

        connect(sessionFactory(messages, send, middleware))
          .then(api => resolve(api))
          .catch(error => reject(error))
      }

      switch(socket.readyState) {
        case 0:
        case "connecting":
          socket.on('open', initialize)
          break
        case 1:
        case "open":
          initialize()
          break
        case 2:
        case 3:
        case "closing":
        case "closed":
          throw new Error("Socket is already closed")
      }
    })
  }

  return consumer
}