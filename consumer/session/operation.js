const { subject } = require('xest')

module.exports = (messages, data, send) => new Promise((resolve, reject) => {
  let observable

  send.operation(data)

  messages.subscribe(({ status, data }) => {
    if(status === 'ok') {
      if(data.type === 'static') {
        messages.disconnect()
        resolve(data.value)

      } else if(data.type === 'observable') {
        observable = subject({ initialValue: data.value })
        observable.disconnect = () => {
          send.terminate()
          messages.disconnect()
        }
        resolve(observable)

      } else {
        messages.disconnect()
        reject(new Error(`Unknown response data type ${data.type}`))
      }
    
    } else if(status === 'update') {
      observable.publish(data.value)

    } else if(status === 'error') {
      messages.disconnect()
      reject(data)
    }
  })
})
