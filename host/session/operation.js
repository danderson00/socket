const { isObservable, unwrap } = require('@x/expressions')
const throttle = require('./throttle')

module.exports = (observable, context, options = {}) => {
  const { send, hostApi, disconnect } = context
  const request = observable()
  const { operation, parameters } = request.data
  const reestablish = request.session === 'reestablish'
  const log = context.log.child({ operation })

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

  log.info(`Session ${reestablish ? 're' : ''}established`, { reestablish })

  const promise = hostApi.execute(operation, patchParameters(parameters), context)
    .then(value => {
      if(isObservable(value)) {
        const resultSubscription = value.subscribe(
          throttle(
            newValue => send.update({ value: unwrap(newValue) }),
            options.throttle
          )
        )

        const errorSubscription = value.errorObservable && value.errorObservable.subscribe(
          throttle(
            error => send.update({ type: 'error', error }),
            options.throttle
          )
        )

        if(reestablish) {
          send.update({ value: unwrap(value), error: value.errorObservable && value.errorObservable() })
        } else {
          send.ok({
            type: 'observable',
            value: unwrap(value),
            hasErrorObservable: !!value.errorObservable,
            error: value.errorObservable && value.errorObservable()
          }, 'persistent')
        }        
    
        const closeSubscription = context.connection.events.subscribe(({ topic }) => {
          if(topic === 'close' || topic === 'error') {
            cleanup()
          }
        })

        cleanup = () => {
          log.info(`Session terminated`)
          resultSubscription.unsubscribe()
          closeSubscription.unsubscribe()
          errorSubscription && errorSubscription.unsubscribe()
          if(value.disconnect) {
            value.disconnect()
          }
        }
    
      } else {
        send.ok({ type: 'static', value })   
        disconnect()
        log.info(`Session terminated`)
      }
    })
  
  return promise
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchParameters = (args = []) => args.map(x => x === null ? undefined : x)
