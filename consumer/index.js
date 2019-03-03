const connect = require('./connect')
const sessionFactory = require('./session')
const middlewareModule = require('../common/middleware')
const initializersModule = require('./initializers')
const socketModule = require('./reliableSocket')
const serializerModule = require('../common/serializer')
const loggerModule = require('./logger')

const defaultOptions = {
  serializer: serializerModule(),
  log: { level: 'warn' }
}

module.exports = options => {
  options = { ...defaultOptions, ...options }
  const middleware = middlewareModule()
  const initializers = initializersModule()
  const log = loggerModule(options.log.level)

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
      const socket = await socketModule(options, log)
      const api = await connect(sessionFactory(socket, middleware, options))
      await initializers.execute({ api })
      return api
    }
  }

  return consumer
}