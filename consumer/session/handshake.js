module.exports = (messages, data, send) => new Promise((resolve, reject) => {
  send.handshake({ version: '0.0.1'})

  messages.subscribe(({ status, data }) => {
    messages.disconnect()
    if(status === 'ok') {
      resolve(data)
    } else {
      reject(data)
    }
  })
})
