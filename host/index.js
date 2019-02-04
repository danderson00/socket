const xest = require('xest')
const busModule = require('./bus')
const sessionModule = require('./session')
const responseTypes = require('./responseTypes')
const serializerModule = require('../common/serializer')
const loggerModule = require('./logger')

const defaultOptions = {
  log: { level: 'warn' },
  timeout: 5000
}

module.exports = (server, hostApi, options = {}) => {
  const config = { ...defaultOptions, ...options }
  const log = options.logger || loggerModule(config.log.level)
  const sessionFactory = sessionModule(hostApi, responseTypes)
  const serializer = serializerModule()

  const handleConnection = socket => {
    const observable = xest.fromEventTarget(socket, 'message')
    const bus = busModule(observable, sessionFactory, serializer)

    socket.on('close', (code, reason) => {
      observable.disconnect()
      log.debug(`Socket closed: ${code} - ${reason}`)
    })
    
    socket.on('error', error => {
      observable.disconnect()
      log.error('Socket error', error)
    })
  }

  server.on('connection', handleConnection)

  return {
    // close: () => server.removeEventListener('connection', handleConnection)
  }
}