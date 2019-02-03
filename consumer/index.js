const socketWrapper = require('../common/socketWrapper')

const defaultUrl = (typeof window === undefined || window.location.hostname === 'localhost')
  ? 'ws://localhost:3001/' // if we're running locally, assume a standalone server on 3001
  : `ws://${window.location.hostname}:${window.location.port}/` // otherwise assume embedded

module.exports = (options = {}) => new Promise((resolve, reject) => {
  const WebSocket = options.WebSocket || window.WebSocket
  const socket = socketWrapper(new WebSocket(options.url || defaultUrl))

  socket.on('open', () => {
    handshake().then(metadata => {
      socket.addMessageHandler(handleMessage)
      resolve(api)
    })
  })

  socket.on('close', ({ code, reason }) => console.log(`Socket closed: ${code} - ${reason}`))
  socket.on('error', error => {
    console.error('Socket error', error)
    reject(error)
  })
})