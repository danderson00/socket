module.exports = (api, middleware) => ({
  operations: api.operations, 
  execute: (name, parameters) => {
    const normalizeParameters = supplied => (
      (supplied && supplied.constructor === Array) ? supplied : [supplied]
    )

    return middleware.get(name)
      .reduce(
        (promise, currentMiddleware) => promise.then(
          nextParameters => Promise.resolve(
            currentMiddleware.handler.apply(null, normalizeParameters(nextParameters))
          )
        ),
        Promise.resolve(parameters)
      )
      .then(finalParameters => api.execute(name, normalizeParameters(finalParameters)))
  }
})