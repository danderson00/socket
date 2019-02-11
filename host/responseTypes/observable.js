const { isObservable, unwrap } = require('xest')

module.exports = {
  test: isObservable,
  handler: (sessionObservable, resultObservable, send) => {
    const resultSubscription = resultObservable.subscribe(newValue => send.update({ value: unwrap(newValue) }))
    send.ok({ type: 'observable', value: unwrap(resultObservable) }, 'persistent')

    sessionObservable.subscribe(({ session }) => {
      if(session === 'terminate') {
        resultSubscription.unsubscribe()
        if(resultObservable.disconnect) {
          resultObservable.disconnect()
        }
      }
    })
  }
}