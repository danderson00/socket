const { isObservable, unwrap } = require('xest')

module.exports = {
  test: isObservable,
  handler: (value, { send }) => {
    const subscription = value.subscribe(newValue => send.update({ value: unwrap(newValue) }))
    send.ok({ type: 'observable', value: unwrap(value) }, 'persistent')

    return { 
      messageHandler: ({ session }) => {
        if(session === 'terminate') {
          subscription.unsubscribe()
          if(value.disconnect) {
            value.disconnect()
          }
        }
      }
    }
  }
}