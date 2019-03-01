const connect = require('./connect')
const sessionFactory = require('./session')
const middlewareModule = require('../common/middleware')
const serializer = require('../common/serializer')
const { fromEmitter } = require('xest')

module.exports = (socketFactory, options = {}) => {
  const { serialize, deserialize } = serializer()
  const middleware = middlewareModule()
  const initializers = []

  const chainable = target => (...args) => {
    target.apply(null, args)
    return consumer
  }

  const consumer = {
    use: chainable(middleware.add),
    useFeature: chainable(feature => {
      middleware.add(feature.middleware)
      if(feature.initialize) {
        initializers.push(feature.initialize)
      }
    }),
    connect: () => new Promise((resolve, reject) => {
      const initialize = () => {
        const messages = fromEmitter(socket, 'message').map(({ data }) => deserialize(data))
        const events = fromEmitter(socket, 'error', 'close')
        const send = message => socket.send(serialize(message))

        connect(sessionFactory(messages, send, middleware))
          .then(api => (
            // execute feature initializers - should be refactored out
            Promise.all(initializers.map(x => Promise.resolve(x({ api }))))
              .then(() => resolve(api))
          ))
          .catch(error => reject(error))
      }

      const socket = socketFactory()
      const addListener = socket.on || socket.addEventListener
      addListener.call(socket, 'open', initialize)
    })
  }

  return consumer
}