const xest = require('@xest/core')
const { subject, observable } = xest

module.exports = (parent = subject(), options) => {
  let publish, subscription, source

  const o = xest(observable(p => publish = p, options))
  o.swap = newSource => {
    if(subscription) {
      subscription.unsubscribe()
    }
    source = newSource
    subscription = source.subscribe(publish)
  }
  o.swap(parent)
  o.disconnect = () => source.disconnect && source.disconnect()
  return o
}