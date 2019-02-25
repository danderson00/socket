module.exports = log => {
  let api = {}

  return {
    add: newApi => {
      api = {
        ...api,
        ...Object.keys(newApi).reduce(
          (mapped, name) => {
            if(api[name]) {
              log.warn(`Overriding API function '${name}'`)
            }

            return {
              ...mapped,
              [name]: {
                name,
                handler: newApi[name],
                hostObject: api
              }
            }
          }, {}
        )
      }
    },
    execute: (name, parameters) => {
      if(!api[name] || !api[name].handler) {
        throw new Error(`No operation '${name}' on host API`)
      }
      return Promise.resolve(
        api[name].handler.apply(api[name].hostObject, parameters)
      )
    },
    operations: () => (
      Object.keys(api).map(operation => ({ name: operation }))
    )
  }
}