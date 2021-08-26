const connect = require('./connect')
const sessionFactory = require('./session')
const middlewareModule = require('../common/middleware')
const userConfigurationModule = require('./userConfiguration')
const socketModule = require('./reliableSocket')
const socketWrapper = require('./socketWrapper')
const serializerModule = require('../common/serializer')
const loggerModule = require('../common/logger')

const defaultOptions = {
  serializer: { errorDetail: 'full' },
  log: { level: 'warn' }
}

module.exports = options => {
  options = { ...defaultOptions, ...options }
  const serializer = serializerModule(options.serializer)
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
        ? socketWrapper(options, reconnect, userConfiguration.disconnect, serializer, log)
        : socketModule(options, reconnect, userConfiguration.disconnect, serializer, log)

      const sessions = sessionFactory(options, socket, middleware, log)
      const constructResult = await userConfiguration.construct({ socket, log, sessions, middleware })
      const connectResult = await connect(sessions, constructResult)
      await userConfiguration.initialise(connectResult)
      return connectResult.api

      function reconnect() {
        connect(sessions, constructResult).then(userConfiguration.reconnect)
      }
    }
  }

  return consumer
}