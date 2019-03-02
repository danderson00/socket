const { isObservable, unwrap } = require('xest')

module.exports = (observable, context) => {
  const { send, hostApi } = context
  const { data } = observable()

  let cleanup
  observable.subscribe(({ session }) => {
    if(session === 'terminate') {
      observable.disconnect()
      if(cleanup) {
        cleanup()
      } else {
        promise.then(() => cleanup && cleanup())
      }
    }
  })

  const promise = hostApi.execute(data.operation, patchParameters(data.parameters), context)
    .then(value => {
      if(isObservable(value)) {
        const resultSubscription = value.subscribe(newValue => send.update({ value: unwrap(newValue) }))
        send.ok({ type: 'observable', value: unwrap(value) }, 'persistent')
    
        context.connection.events
          .where(({ topic }) => topic === 'close' || topic === 'error')
          .subscribe(() => value.disconnect && value.disconnect())

        cleanup = () => {
          resultSubscription.unsubscribe()
          if(value.disconnect) {
            value.disconnect()
          }
        }
    
      } else {
        send.ok({ type: 'static', value })   
        observable.disconnect()     
      }
    })
  
  return promise
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchParameters = (args = []) => args.map(x => x === null ? undefined : x)
