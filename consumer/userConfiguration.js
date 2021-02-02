const features = require('./features')

// we want to delay construction of features until after we have connected
// and retrieved the API so features can make use of other API functions
// we still want middleware to be added in the same order the user specifies
module.exports = middleware => {
  const configurationChain = []

  const configurationSeries = generator => configurationChain.reduce(
    async (previous, x) => {
      await previous
      return generator(x)
    },
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
    initialize: context => configurationSeries(async x => {
      if(x.middleware) {
        middleware.add(x.middleware)
      }
      if(x.feature) {
        const constructed = x.constructedFeature = await x.feature(context)

        if(!constructed.name) {
          throw new Error('Feature must have a name')
        }

        if(constructed.middleware) {
          middleware.add(constructed.middleware)
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
