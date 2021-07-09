const { v4: uuid } = require('uuid')

module.exports = () => () => ({
  name: 'clientId',
  onConnect: connection => connection.clientId = uuid()
})