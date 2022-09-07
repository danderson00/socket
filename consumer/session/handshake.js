const { userAgent, screen } = require('../handshakeData')
const { errorCodes } = require('../../common/constants')

module.exports = ({ messages, send, disconnect, data, socket }) => new Promise((resolve, reject) => {
  const disconnectListener = socket.events.subscribe(({ topic, data: { code } }) => {
    disconnectListener.unsubscribe()
    if(topic === 'close' && code === errorCodes.HANDSHAKE_FAILED) {
      reject(new Error('Connection handshake failed'))
    }
  })

  const evaluateData = () => data && Object.keys(data).reduce(
    (result, key) => ({
      ...result,
      [key]: typeof data[key] === 'function' ? data[key]() : data[key]
    }),
    {}
  )

  send.handshake({
    version: '0.0.1',
    data: evaluateData(),
    userAgent: userAgent(),
    screen: screen()
  })

  messages.subscribe(({ status, data }) => {
    disconnect()
    disconnectListener.unsubscribe()
    if(status === 'ok') {
      resolve(data)
    } else {
      reject(data)
    }
  })
})
