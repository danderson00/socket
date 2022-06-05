module.exports = () => {
  let middleware = []

  return {
    add: (...middlewareToAdd) => {
      middlewareToAdd.flat().forEach(newMiddleware => {
        if(newMiddleware) {
          // global middleware is passed as just a function
          if (typeof newMiddleware === 'function') {
            middleware = [...middleware, {
              name: null,
              handler: newMiddleware
            }]

          } else {
            middleware = [...middleware,
              ...Object.keys(newMiddleware).map(name => ({
                  name,
                  handler: newMiddleware[name]
                })
              )
            ]
          }
        }
      })
    },
    get: name => middleware.filter(x => x.name === name || x.name === null)
  }
}