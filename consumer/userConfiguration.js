const features = require('./features')

// we want to delay construction of features until after we have connected
// and retrieved the API so features can make use of other API functions
// we still want middleware to be added in the same order the user specifies
module.exports = middleware => {
  const configurationChain = []

  const configurationSeries = generator => configurationChain.reduce(
    (previous, x) => previous.then(
      existing => generator(x).then(current => ({ ...existing, ...current }))
    ),
    Promise.resolve()
  )

  const builtInFeature = (name, options) => {
    const builtIn = features[name]
    if(!builtIn) {
      throw new Error(`No such built-in feature ${name}`)
    }
    return builtIn(options)
  }

  return {
    use: middleware => configurationChain.push({ middleware }),
    useFeature: (feature, options) => {
      if(typeof feature === 'string') {
        feature = builtInFeature(feature, options)
      }
      configurationChain.push({ feature })
    },
    construct: context => configurationSeries(async x => {
      if(x.feature) {
        x.constructedFeature = await x.feature(context)
        if(!x.constructedFeature.name) {
          throw new Error('Feature must have a name')
        }
        // a bit brittle to explicitly return handshakeData here but no requirement to generalise yet
        return { [x.constructedFeature.name]: x.constructedFeature.handshakeData }
      }
    }).then(handshakeData => ({ handshakeData })),
    initialise: context => configurationSeries(async x => {
      if(x.middleware) {
        middleware.add(x.middleware)
      }
      if(x.feature) {
        const initialised = x.constructedFeature.initialise(context)

        if(initialised.middleware) {
          middleware.add(initialised.middleware)
        }
      }
    }),
    // middleware connect functions are not executed on initial connect
    // as they have not been constructed yet. rename -> reconnect?
    connect: context => {
      return configurationSeries(async x => {
        if(x.constructedFeature && x.constructedFeature.connect) {
          await x.constructedFeature.connect(context)
        }
      })
    }
  }
}
