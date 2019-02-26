module.exports = (api, middleware, context) => (
  middleware.reverse()
    .reduce(
      (next, current) => executor(current, next, context),
      (...args) => Promise.resolve(api.handler.apply(api.hostObject, args))
    )
)

const executor = (middleware, next, context) => (
  (...args) => (
    Promise.resolve(middleware.handler({ 
      ...context,
      args,
      next: (...suppliedArgs) => next.apply(
        null, 
        suppliedArgs.length === 0 ? args : suppliedArgs
      )
    }))
  )
)