const logger = require('./logger')

const defaultOptions = {
  log: { level: 'warn' }
}

module.exports = (server, hostApi, options = {}) => {
  const config = { ...defaultOptions, ...options }
  const log = logger(config.log.level)
  
  server.on('connection', socket => {
    socket.on('message', messageAdapter(socket, hostApi, log))
    socket.on('close', (code, reason) => console.log(`Socket closed: ${code} - ${reason}`))
    socket.on('error', error => console.error('Socket error', error))
  })

  return {
    close: () => server.close()
  }
}