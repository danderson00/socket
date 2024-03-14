const observable = require('@x/observable')

module.exports = (source, property, groupSink) => {
  const groups = {}

  const createSinkObservable = key => {
    const o = observable((publish, o) => {
      o.publish = publish
      o.key = key
      return () => delete groups[key]
    })
    groupSink(o)
    return o
  }

  // for our limited use case, we don't need to unsubscribe
  source.subscribe(value => {
    const key = value?.[property]
    if(key) {
      const sink = groups[key] = groups[key] || createSinkObservable(key)
      sink.publish(value)
    }
  })

  return {
    count: () => Object.keys(groups).length
  }
}
