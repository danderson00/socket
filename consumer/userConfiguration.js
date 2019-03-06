// we want to delay construction of features until after we have connected
// and retrieved the API so features can make use of other API functions
// we still want middleware to be added in the same order the user specifies
module.exports = middleware => {
  const configurationChain = []

  return {
    use: middleware => configurationChain.push({ middleware }),
    useFeature: feature => configurationChain.push({ feature }),
    initialize: context => (
      configurationChain.reduce(
        async (previous, x) => {
          await previous
          if(x.middleware) {
            middleware.add(x.middleware)
          }
          if(x.feature) {
            const constructedFeature = await Promise.resolve(x.feature(context))
            if(constructedFeature.middleware) {
              middleware.add(constructedFeature.middleware)            
            }
          }
        },
        Promise.resolve()
      )
    )
  }
}