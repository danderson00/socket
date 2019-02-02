const logger = require('./logger')
const handshake = require('./handshake')

const defaultOptions = {
  log: { level: 'warn' },
  timeout: 5000
}

module.exports = (server, hostApi, options = {}) => {
  const config = { ...defaultOptions, ...options }
  const log = logger(config.log.level)

  server.on('connection', socket => {
    handshake(socket, options)
      .then(() => socket.on('message', messageAdapter(socket, hostApi, config, log)))
      .catch(error => log.error(`Failed to handshake`, error))
      
    socket.on('close', (code, reason) => console.log(`Socket closed: ${code} - ${reason}`))
    socket.on('error', error => console.error('Socket error', error))
  })

  return {
    close: () => server.close()
  }
}