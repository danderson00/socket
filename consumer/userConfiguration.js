const features = require('./features')

// we want to delay construction of features until after we have connected
// and retrieved the API so features can make use of other API functions
// we still want middleware to be added in the same order the user specifies
module.exports = middleware => {
  const configurationChain = []

  return {
    use: middleware => configurationChain.push({ middleware }),
    useFeature: (feature, options) => {
      if(typeof feature === 'string') {
        feature = builtInFeature(feature, options)
      }
      configurationChain.push({ feature })
    },
    initialize: context => (
      configurationChain.reduce(
        async (previous, x) => {
          await previous
          if(x.middleware) {
            middleware.add(x.middleware)
          }
          if(x.feature) {
            x.constructedFeature = await Promise.resolve(x.feature(context))
            if(x.constructedFeature.middleware) {
              middleware.add(x.constructedFeature.middleware)            
            }
          }
        },
        Promise.resolve()
      )
    ),
    // middleware connect functions are not executed on initial connect
    // as they have not been constructed yet. rename -> reconnect?
    connect: context => (
      configurationChain.reduce(
        async (previous, x) => {
          await previous
          if(x.constructedFeature && x.constructedFeature.connect) {
            await Promise.resolve(x.constructedFeature.connect(context))
          }
        },
        Promise.resolve()
      )
    )
  }
}

const builtInFeature = (name, options) => {
  const builtIn = features[name]
  if(!builtIn) {
    throw new Error(`No such built-in feature ${name}`)
  }
  return builtIn(options)
}