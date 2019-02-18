const connect = require('./connect')
const sessionFactory = require('./session')
const serializer = require('../common/serializer')
const { fromEmitter } = require('xest')

module.exports = (socket, options = {}) => new Promise((resolve, reject) => {
  const { serialize, deserialize } = serializer()

  socket.on('open', () => {
    const messages = fromEmitter(socket, 'message').map(({ data }) => deserialize(data))
    const events = fromEmitter(socket, 'error', 'close')
    const send = message => socket.send(serialize(message))

    connect(sessionFactory(messages, send))
      .then(api => resolve(api))
      .catch(error => reject(error))
  })
})