const connect = require('./connect')
const sessionFactory = require('./session')
const middlewareModule = require('../common/middleware')
const userConfigurationModule = require('./userConfiguration')
const socketModule = require('./reliableSocket')
const socketWrapper = require('./socketWrapper')
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
  const log = loggerModule({ ...options.log, scope: { origin: 'consumer', source: 'socket.consumer' } })

  const chainable = target => (...args) => {
    target.apply(null, args)
    return consumer
  }

  const consumer = {
    use: chainable(userConfiguration.use),
    useFeature: chainable(userConfiguration.useFeature),

    connect: async () => {
      const socket = options.socket
        ? socketWrapper(options, userConfiguration.connect, log)
        : socketModule(options, userConfiguration.connect, log)

      const sessions = sessionFactory(socket, middleware, options)
      const { api, handshakeData } = await connect(sessions)
      await userConfiguration.initialize({ socket, api, log, sessions, middleware, handshakeData })
      return api
    }
  }

  return consumer
}