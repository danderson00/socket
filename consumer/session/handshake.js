module.exports = (data, { send }) => {
  let messageHandler

  const responsePromise = new Promise((resolve, reject) => {
    send.handshake({ version: '0.0.1'})

    messageHandler = ({ status, data }) => {
      if(status === 'ok') {
        resolve(data)
      } else if(status === 'error') {
        reject(data)
      }
    }  
  })

  return { responsePromise, messageHandler }
}