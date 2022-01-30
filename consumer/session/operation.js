const { subject } = require('@x/observable')
const pipeline = require('../../common/pipeline')

module.exports = (session, log) => pipeline(
  { handler: (...parameters) => executeOperation(session, parameters, log) },
  session.middleware.get(session.data.operation),
  { ...session }
)(...session.data.parameters)

const executeOperation = (session, parameters, log) => new Promise((resolve, reject) => {
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
        observable.errorObservable = subject({ initialValue: data.error })

        if(data.error) {
          log.error(`An error occurred in the ${session.data.operation} operation observable`, data.error.error, { frames: data.error.frames })
        }

        resolve(observable)

      } else {
        disconnect()
        reject(new Error(`Unknown response data type ${data.type}`))
      }
    
    } else if(status === 'update') {
      if(data.type === 'error') {
        log.error(`An error occurred in the ${session.data.operation} operation observable`, data.error.error, { frames: data.error.frames })
        observable.errorObservable.publish(data.error)
      } else {
        observable.publish(data.value)
      }

    } else if(status === 'error') {
      disconnect()
      reject(data)
    }
  })
})
