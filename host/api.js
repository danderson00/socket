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
    get: name => {
      if(!api[name] || !api[name].handler) {
        throw new Error(`No operation '${name}' on host API`)
      }
      return api[name]
    },
    operations: () => (
      Object.keys(api).map(operation => ({ name: operation }))
    )
  }
}