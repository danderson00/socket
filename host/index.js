const sessionModule = require('./session')
const connectionsModule = require('./connections')
const serializerModule = require('../common/serializer')
const loggerModule = require('../common/logger')
const apiModule = require('./api')
const middlewareModule = require('../common/middleware')
const executorModule = require('./executor')
const features = require('./features')
const { writers } = require('@x/log')

const defaultOptions = {
  log: { level: 'info' },
  throttle: false,
  timeout: 5000,
  serializer: { errorDetail: 'minimal' }
}

module.exports = ({ server, socket, httpServer }, userOptions = {}) => {
  const options = { ...defaultOptions, ...userOptions }
  const log = options.logger
    ? options.logger.child({ origin: 'host', source: 'socket.host' })
    : loggerModule({ ...options.log, scope: { origin: 'host', source: 'socket.host' } })
  const serializer = serializerModule(options.serializer)
  const api = apiModule(log)
  const middleware = middlewareModule(log)
  const executor = executorModule(api, middleware, log)
  const sessionFactory = sessionModule(executor, log, options)
  const connections = connectionsModule({ server, socket }, sessionFactory, serializer, log)

  const chainable = target => (...args) => {
    target.apply(null, args)
    return host
  }

  const host = {
    connections,
    useApi: chainable(api.add),
    use: chainable(middleware.add),
    // TODO: refactor this to features module
    useFeature: chainable((feature, featureOptions) => {
      if(typeof feature === 'string') {
        feature = builtInFeature(feature, featureOptions)
      }

      const constructed = feature({ log, executor, connections, hostOptions: options, server, httpServer })

      if(!constructed.name) {
        throw new Error('Feature must have name')
      }

      if(constructed.onConnect) {
        connections.registerConnectCallback(constructed.onConnect)
      }

      api.add(constructed.api)
      middleware.add(constructed.middleware)
      sessionFactory.addHandshake(constructed.name, constructed.handshake)
    })
  }

  return host
}

const builtInFeature = (name, options) => {
  const builtIn = features[name]
  if(!builtIn) {
    throw new Error(`No such built-in feature ${name}`)
  }
  return builtIn(options)
}

module.exports.logWriters = writers
