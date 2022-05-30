const connect = require('./connect')
const sessionFactory = require('./session')
const middlewareModule = require('../common/middleware')
const userConfigurationModule = require('./userConfiguration')
const reliableSocket = require('./reliableSocket')
const socketWrapper = require('./socketWrapper')
const serializerModule = require('../common/serializer')
const loggerModule = require('../common/logger')

const defaultOptions = {
  serializer: { errorDetail: 'full' },
  log: { level: 'warn' }
}

module.exports = userOptions => {
  const options = { ...defaultOptions, ...userOptions }

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
        ? socketWrapper(options, onConnect, userConfiguration.disconnect, serializer, log)
        : reliableSocket(options, onConnect, userConfiguration.disconnect, serializer, log)

      const sessions = sessionFactory(socket, middleware, log)
      const constructResult = await userConfiguration.construct({ socket, log, sessions, middleware })
      const connectResult = await connect(sessions, constructResult)
      await userConfiguration.initialise(connectResult)
      return connectResult.api

      function onConnect({ reconnect }) {
        if(reconnect) {
          connect(sessions, constructResult).then(userConfiguration.reconnect)
        }
      }
    }
  }

  return consumer
}