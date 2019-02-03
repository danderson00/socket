const busModule = require('./bus')
const sessionFactory = require('./session')
const serializer = require('../common/serializer')

module.exports = (socket, options = {}) => new Promise((resolve, reject) => {
  socket.on('open', () => {
    busModule(socket, sessionFactory(), serializer())
      .then(api => resolve(api))
      .catch(error => reject(error))
  })

  socket.on('close', (code, reason) => console.log(`Socket closed: ${code} - ${reason}`))
  socket.on('error', error => {
    console.error('Socket error', error)
    reject(error)
  })
})