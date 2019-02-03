const socketWrapper = require('../common/socketWrapper')

module.exports = (socket, options = {}) => new Promise((resolve, reject) => {
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