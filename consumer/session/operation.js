const { errorObservable } = require('@xest/core/src/observable')

const { subject } = require('@xest/core/src/observable')
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

        if(data.hasErrorObservable) {
          observable.errorObservable = errorObservable(undefined, undefined, { initialValue: data.error })
          if(data.error) {
            // TODO: this is not the right place to log expression errors, it should be done higher up in the stack, i.e. xest.react
            log.error(`An error occurred in the ${session.data.operation} operation observable`, data.error.error, { frames: data.error.frames })
          }
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
