module.exports = (sessionFactory, constructResult) => {
  return sessionFactory.create('handshake', constructResult.handshakeData)
    .then(handshakeData => {
      const executeOperation = (operation, immediate) => (...parameters) =>
        sessionFactory.create('operation', { operation, parameters }, immediate)

      const api = handshakeData.operations.reduce(
        (api, operation) => {
          const result = { ...api, [operation.name]: executeOperation(operation.name) }
          result[operation.name].immediate = executeOperation(operation.name, true)
          return result
        },
        {}
      )

      return { api, handshakeData }
    })
}
