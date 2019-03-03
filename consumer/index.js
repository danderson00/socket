const connect = require('./connect')
const sessionFactory = require('./session')
const middlewareModule = require('../common/middleware')
const initializersModule = require('./initializers')
const socketModule = require('./socket')
const serializerModule = require('../common/serializer')

module.exports = (socketFactory, options = {}) => {
  const serializer = serializerModule()
  const middleware = middlewareModule()
  const initializers = initializersModule()

  const chainable = target => (...args) => {
    target.apply(null, args)
    return consumer
  }

  const consumer = {
    use: chainable(middleware.add),
    useFeature: chainable(feature => {
      middleware.add(feature.middleware)
      initializers.add(feature.initialize)
    }),
    connect: async () => {
      const socket = await socketModule(socketFactory, serializer, options)
      const api = await connect(sessionFactory(socket, middleware, options))
      await initializers.execute({ api })
      return api
    }
  }

  return consumer
}