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
  const { serialize, deserialize } = serializerModule()

  const serverObservable = xest.fromEventTarget(server, 'connection')
  
  serverObservable.subscribe(socket => {
    const connectionObservable = xest.fromEventTarget(socket, 'message').map(deserialize)
    connectionObservable.send = message => socket.send(serialize(message))
    socket.on('close', code => log.info(`Connection closed: ${code}`)),
    socket.on('error', error => log.error(`Connection error`, error))

    const sessions = busModule(connectionObservable, sessionFactory)
  })

  return {
    close: () => serverObservable.disconnect()
  }
}