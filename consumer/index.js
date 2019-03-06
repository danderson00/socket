const connect = require('./connect')
const sessionFactory = require('./session')
const middlewareModule = require('../common/middleware')
const userConfigurationModule = require('./userConfiguration')
const socketModule = require('./reliableSocket')
const serializerModule = require('../common/serializer')
const loggerModule = require('../common/logger')

const defaultOptions = {
  serializer: serializerModule(),
  log: { level: 'warn' }
}

module.exports = options => {
  options = { ...defaultOptions, ...options }
  const middleware = middlewareModule()
  const userConfiguration = userConfigurationModule(middleware)
  const log = loggerModule(options.log)

  const chainable = target => (...args) => {
    target.apply(null, args)
    return consumer
  }

  const consumer = {
    use: chainable(userConfiguration.use),
    useFeature: chainable(userConfiguration.useFeature),

    connect: async () => {
      const socket = await socketModule(options, log)
      const api = await connect(sessionFactory(socket, middleware, options))
      await userConfiguration.initialize({ socket, api, log })
      return api
    }
  }

  return consumer
}