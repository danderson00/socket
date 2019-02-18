module.exports = sessionFactory => {
  return sessionFactory.create('handshake')
    .then(({ operations }) => {
        const executeOperation = operation => (...parameters) => 
          sessionFactory.create('operation', { operation, parameters })

        return operations.reduce(
          (api, operation) => ({ ...api, [operation.name]: executeOperation(operation.name) }),
          {}
        )
    })
}
