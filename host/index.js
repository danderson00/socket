const sessionModule = require('./session')
const connectionsModule = require('./connections')
const serializerModule = require('../common/serializer')
const loggerModule = require('./logger')
const apiModule = require('./api')

const defaultOptions = {
  log: { level: 'warn' },
  timeout: 5000
}

module.exports = (server, options = {}) => {
  options = { ...defaultOptions, ...options }
  const log = options.logger || loggerModule(options.log.level)
  const serializer = serializerModule()
  const api = apiModule(log)
  const sessionFactory = sessionModule(api, log)
  const connections = connectionsModule(server, sessionFactory, serializer, log)

  const host = {
    connections,
    useApi: (...args) => {
      api.add.apply(null, args)
      return host
    }
  }

  return host
}