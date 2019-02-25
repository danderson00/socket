const sessionModule = require('./session')
const connectionsModule = require('./connections')
const serializerModule = require('../common/serializer')
const loggerModule = require('./logger')
const apiModule = require('./api')
const middlewareModule = require('./middleware')
const pipelineModule = require('./pipeline')

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
  const pipeline = pipelineModule(api, middleware, log)
  const sessionFactory = sessionModule(pipeline, log)
  const connections = connectionsModule(server, sessionFactory, serializer, log)

  const chainable = target => (...args) => {
    target.apply(null, args)
    return host
  }

  const host = {
    connections,
    useApi: chainable(api.add),
    use: chainable(middleware.add)
  }

  return host
}