const { encrypt, decrypt } = require('./cipher')
const { v4: uuid } = require('uuid')

module.exports = ({ cipherKey }) => () => ({
  name: 'clientId',
  handshake: (data, context) => {
    const clientId = data.clientId ? decrypt(new Buffer(data.clientId, 'base64'), cipherKey) : uuid()
    context.connection.clientId = clientId
    return {
      clientId: encrypt(clientId, cipherKey).toString('base64')
    }
  }
})
