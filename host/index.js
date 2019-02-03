const busModule = require('./bus')
const sessionModule = require('./session')
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

  const handleConnection = socket => {
    const bus = busModule(socket, sessionFactory, serializer)

    socket.on('close', (code, reason) => {
      bus.close()
      log.debug(`Socket closed: ${code} - ${reason}`)
    })
    
    socket.on('error', error => {
      bus.close()
      log.error('Socket error', error)
    })
  }

  server.on('connection', handleConnection)

  return {
    // close: () => server.removeEventListener('connection', handleConnection)
  }
}