const { subject } = require('@xest/core')
const pipeline = require('../../common/pipeline')

module.exports = session => pipeline(
  { handler: (...parameters) => executeOperation(session, parameters) },
  session.middleware.get(session.data.operation),
  { ...session }
)(...session.data.parameters)

const executeOperation = (session, parameters) => new Promise((resolve, reject) => {
  const { messages, data, send, disconnect, terminate } = session
  let observable

  session.request = { ...data, parameters }

  send.operation(session.request)

  messages.subscribe(({ status, data }) => {
    if(status === 'ok') {
      if(data.type === 'static') {
        disconnect()
        resolve(data.value)

      } else if(data.type === 'observable') {
        observable = subject({ initialValue: data.value })
        observable.disconnect = terminate
        resolve(observable)

      } else {
        disconnect()
        reject(new Error(`Unknown response data type ${data.type}`))
      }
    
    } else if(status === 'update') {
      observable.publish(data.value)

    } else if(status === 'error') {
      disconnect()
      reject(data)
    }
  })
})
