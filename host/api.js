module.exports = log => {
  let api = {}

  const resolveApi = newApi => typeof newApi === 'function' ? newApi({ log }) : newApi

  return {
    add: newApi => {
      const resolvedApi = resolveApi(newApi)
      api = {
        ...api,
        ...Object.keys(resolvedApi || {}).reduce(
          (mapped, name) => {
            if(api[name]) {
              log.warn(`Overriding API function '${name}'`)
            }

            return {
              ...mapped,
              [name]: {
                name,
                handler: resolvedApi[name],
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