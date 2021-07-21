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
        ? socketWrapper(options, reconnect, serializer, log)
        : socketModule(options, reconnect, serializer, log)

      const sessions = sessionFactory(options, socket, middleware, log)
      await userConfiguration.construct({ socket, log, sessions, middleware })
      const { api, handshakeData } = await connect(sessions)
      await userConfiguration.initialise({ api, handshakeData })
      return api

      function reconnect() {
        connect(sessions).then(userConfiguration.connect)
      }
    }
  }

  return consumer
}