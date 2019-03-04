const { isObservable, unwrap } = require('xest')

module.exports = (observable, context) => {
  const { send, hostApi, disconnect } = context
  const { data } = observable()

  // *sigh* things start to rot pretty quickly
  // we need to subscribe to the session observable immediately
  // in case we get a terminate immediately after establish,
  // but the host API call may not have finished, so wait for
  // it to finish before attempting to clean up
  let cleanup
  observable.subscribe(({ session }) => {
    if(session === 'terminate') {
      disconnect()
      // clean up immediately if available
      if(cleanup) {
        cleanup()
      } else {
        promise.then(() => cleanup && cleanup())
      }
    }
  })

  context.log.trace(`Establishing session ${context.id}`)

  const promise = hostApi.execute(data.operation, patchParameters(data.parameters), context)
    .then(value => {
      if(isObservable(value)) {
        const resultSubscription = value.subscribe(newValue => send.update({ value: unwrap(newValue) }))
        send.ok({ type: 'observable', value: unwrap(value) }, 'persistent')
    
        context.connection.events
          .where(({ topic }) => topic === 'close' || topic === 'error')
          .subscribe(() => value.disconnect && value.disconnect())

        cleanup = () => {
          context.log.trace(`Terminating session ${context.id}`)
          resultSubscription.unsubscribe()
          if(value.disconnect) {
            value.disconnect()
          }
        }
    
      } else {
        send.ok({ type: 'static', value })   
        disconnect()     
      }
    })
  
  return promise
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchParameters = (args = []) => args.map(x => x === null ? undefined : x)
