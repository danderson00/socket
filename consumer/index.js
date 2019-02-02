const defaultUrl = (typeof window === undefined || window.location.hostname === 'localhost')
  ? 'ws://localhost:3001/' // if we're running locally, assume a standalone server on 3001
  : `ws://${window.location.hostname}:${window.location.port}/` // otherwise assume embedded

module.exports = (options = {}) => new Promise((resolve, reject) => {
  const WebSocket = options.WebSocket || window.WebSocket
  const socket = new WebSocket(options.url || defaultUrl)

  socket.addEventListener('open', () => {
    handshake().then(metadata => {
      socket.addEventListener('message', handleMessage)
      resolve(api)
    })
  })

  socket.addEventListener('close', ({ code, reason }) => console.log(`Socket closed: ${code} - ${reason}`))
  socket.addEventListener('error', error => {
    console.error('Socket error', error)
    reject(error)
  })
})