module.exports = ({ messages, send, disconnect }) => new Promise((resolve, reject) => {
  send.handshake({ version: '0.0.1'})

  messages.subscribe(({ status, data }) => {
    disconnect()
    if(status === 'ok') {
      resolve(data)
    } else {
      reject(data)
    }
  })
})
