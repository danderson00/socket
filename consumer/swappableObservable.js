const { subject, observable } = require('xest')

module.exports = (parent = subject(), options) => {
  let publish, subscription, source

  const o = observable(p => publish = p, options)
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