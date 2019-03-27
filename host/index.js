const sessionModule = require('./session')
const connectionsModule = require('./connections')
const serializerModule = require('../common/serializer')
const loggerModule = require('../common/logger')
const apiModule = require('./api')
const middlewareModule = require('../common/middleware')
const executorModule = require('./executor')
const features = require('./features')

const defaultOptions = {
  log: { level: 'warn' },
  timeout: 5000
}

module.exports = (server, options = {}) => {
  options = { ...defaultOptions, ...options }
  const log = options.logger || loggerModule(options.log)
  const serializer = serializerModule()
  const api = apiModule(log)
  const middleware = middlewareModule(log)
  const executor = executorModule(api, middleware, log)
  const sessionFactory = sessionModule(executor, log)
  const connections = connectionsModule(server, sessionFactory, serializer, log)

  const chainable = target => (...args) => {
    target.apply(null, args)
    return host
  }

  const host = {
    connections,
    useApi: chainable(api.add),
    use: chainable(middleware.add),
    useFeature: chainable((feature, options) => {
      if(typeof feature === 'string') {
        feature = builtInFeature(feature, options)
      }

      const constructed = feature({ log, executor, connections })
      api.add(constructed.api)
      middleware.add(constructed.middleware)
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