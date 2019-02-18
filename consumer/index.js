const connect = require('./connect')
const sessionFactory = require('./session')
const { serialize, deserialize } = require('../common/serializer')

module.exports = (socket, options = {}) => new Promise((resolve, reject) => {
  socket.on('open', () => {
    const messages = xest.fromEmitter(socket, 'message').map(deserialize)
    const events = xest.fromEmitter(socket, 'error', 'close')
    const send = message => socket.send(serialize(message))

    connect(sessionFactory(messages, send))
      .then(api => resolve(api))
      .catch(error => reject(error))
  })
})