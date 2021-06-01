module.exports = connection => {
  const attached = {}

  connection.events.topic('close', 'error').subscribe(() =>
    Object.values(attached).forEach(o => o.disconnect())
  )

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