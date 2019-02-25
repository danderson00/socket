const { isObservable, unwrap } = require('xest')

module.exports = (observable, { send, hostApi }) => {
  const { data } = observable()

  return hostApi.execute(data.operation, patchParameters(data.parameters))
    .then(value => {
      if(isObservable(value)) {
        const resultSubscription = value.subscribe(newValue => send.update({ value: unwrap(newValue) }))
        send.ok({ type: 'observable', value: unwrap(value) }, 'persistent')
    
        observable.subscribe(({ session }) => {
          if(session === 'terminate') {
            resultSubscription.unsubscribe()
            observable.disconnect()
            if(value.disconnect) {
              value.disconnect()
            }
          }
        })
    
      } else {
        send.ok({ type: 'static', value })   
        observable.disconnect()     
      }
    })
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchParameters = (args = []) => args.map(x => x === null ? undefined : x)
