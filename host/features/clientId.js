const cipher = require('../utilities/cipher')
const { v4: uuid } = require('uuid')

module.exports = ({ cipherKey: password } = {}) => {
  if(!password) {
    throw new Error('You must provide a cipherKey')
  }

  const { encrypt, decrypt, getKeyFromPassword } = cipher()
  const cipherKey = getKeyFromPassword(password)
  const decryptClientId = encrypted => {
    try {
      return decrypt(Buffer.from(encrypted, 'base64'), cipherKey).toString('utf8')
    } catch {
      return uuid()
    }
  }

  return () => ({
    name: 'clientId',
    handshake: ({ data }, context) => {
      const clientId = data.clientId ? decryptClientId(data.clientId) : uuid()
      context.connection.clientId = clientId
      context.connection.log.setScope({ clientId })
      return encrypt(clientId, cipherKey).toString('base64')
    }
  })
}
