module.exports = sessionFactory => {
  return sessionFactory.create('handshake')
    .then(({ operations }) => {
        const executeOperation = (operation, direct) => (...parameters) => 
          sessionFactory.create('operation', { operation, parameters }, direct)

        return operations.reduce(
          (api, operation) => {
            const result = { ...api, [operation.name]: executeOperation(operation.name) }
            result[operation.name].direct = executeOperation(operation.name, true)
            return result
          },
          {}
        )
    })
}
