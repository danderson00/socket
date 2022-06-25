const { userAgent, screen } = require('../handshakeData')

module.exports = ({ messages, send, disconnect, data }) => new Promise((resolve, reject) => {
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
    if(status === 'ok') {
      resolve(data)
    } else {
      reject(data)
    }
  })
})
