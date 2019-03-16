module.exports = sessionFactory => {
  return sessionFactory.create('handshake')
    .then(({ operations }) => {
        const executeOperation = (operation, immediate) => (...parameters) => 
          sessionFactory.create('operation', { operation, parameters }, immediate)

        return operations.reduce(
          (api, operation) => {
            const result = { ...api, [operation.name]: executeOperation(operation.name) }
            result[operation.name].immediate = executeOperation(operation.name, true)
            return result
          },
          {}
        )
    })
}
