const { subject } = require('xest')
const pipeline = require('../../common/pipeline')

module.exports = context => pipeline(
  { handler: (...parameters) => executeOperation(context, parameters) },
  context.middleware.get(context.data.operation),
  { ...context }
)(...context.data.parameters)

const executeOperation = (context, parameters) => new Promise((resolve, reject) => {
  const { messages, data, send } = context
  let observable

  send.operation({ ...data, parameters })

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
