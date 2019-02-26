const sessionModule = require('./session')
const connectionsModule = require('./connections')
const serializerModule = require('../common/serializer')
const loggerModule = require('./logger')
const apiModule = require('./api')
const middlewareModule = require('../common/middleware')
const executorModule = require('./executor')

const defaultOptions = {
  log: { level: 'warn' },
  timeout: 5000
}

module.exports = (server, options = {}) => {
  options = { ...defaultOptions, ...options }
  const log = options.logger || loggerModule(options.log.level)
  const serializer = serializerModule()
  const api = apiModule(log)
  const middleware = middlewareModule(log)
  const executor = executorModule(api, middleware)
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
    useFeature: chainable(feature => {
      api.add(feature.api)
      middleware.add(feature.middleware)
    })
  }

  return host
}