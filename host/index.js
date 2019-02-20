const sessionModule = require('./session')
const connectionsModule = require('./connections')
const serializerModule = require('../common/serializer')
const loggerModule = require('./logger')

const defaultOptions = {
  log: { level: 'warn' },
  timeout: 5000
}

module.exports = (server, hostApi, options = {}) => {
  const config = { ...defaultOptions, ...options }
  const log = options.logger || loggerModule(config.log.level)
  const sessionFactory = sessionModule(hostApi, log)
  const serializer = serializerModule()
  return connectionsModule(server, sessionFactory, serializer, log)
}