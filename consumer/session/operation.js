module.exports = (data, { send, terminate, responseTypes }) => {
  let messageHandler, responseHandler

  const responsePromise = new Promise((resolve, reject) => {
    send.operation(data)

    messageHandler = ({ status, data }) => {
      if(status === 'ok') {
        if(data.type === 'static') {
          resolve(data.value)
        } else {
          const handler = responseTypes[data.type]
          if(handler) {
            responseHandler = handler.handler(data.value, { send, terminate })
            resolve(responseHandler.value)
          } else {
            reject(new Error(`Unknown data type ${data.type}`))
          }
        }
      
      } else if(status === 'update') {
        responseHandler.update(data)

      } else if(status === 'error') {
        reject(data)
      }
    }
  })

  return { responsePromise, messageHandler }
}