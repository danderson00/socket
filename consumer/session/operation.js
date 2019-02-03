module.exports = (data, { send, terminate }) => {
  let messageHandler

  const responsePromise = new Promise((resolve, reject) => {
    send.operation(data)

    messageHandler = ({ status, data }) => {
      if(status === 'ok') {
        if(data.type === 'static') {
          resolve(data.value)
        } else {
          // hook up specific response handlers here
          reject(new Error(`Unknown data type ${data.type}`))
        }

      } else if(status === 'error') {
        reject(data)
      }
    }
  })

  return { responsePromise, messageHandler }
}