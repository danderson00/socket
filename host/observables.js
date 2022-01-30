module.exports = connection => {
  const attached = {}

  const closeSubscription = connection.events.subscribe(({ topic }) => {
    if (topic === 'close' || topic === 'error') {
      Object.values(attached).forEach(o => o.disconnect())
      closeSubscription.unsubscribe()
    }
  })

  const observables = name => attached[name]
  observables.attach = (name, observable) => attached[name] = observable
  observables.disconnect = name => {
    const observable = attached[name]
    if(observable) {
      observable.disconnect()
      delete attached[name]
    }
    return observable
  }
  return observables
}