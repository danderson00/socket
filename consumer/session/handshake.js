const getUserAgent = require('../userAgent')

module.exports = ({ messages, send, disconnect, data }) => new Promise((resolve, reject) => {
  send.handshake({ version: '0.0.1', data, userAgent: getUserAgent() })

  messages.subscribe(({ status, data }) => {
    disconnect()
    if(status === 'ok') {
      resolve(data)
    } else {
      reject(data)
    }
  })
})
