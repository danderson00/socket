const cipher = require('../../host/features/cipher')

const plainText = 'my message text'

it('text matches after encrypt/decrypt with a randomly generated key', () => {
  const key = cipher.getRandomKey()
  const cipherText = cipher.encrypt(plainText, key)
  const decryptOutput = cipher.decrypt(cipherText, key)

  expect(decryptOutput.toString('utf8')).toEqual(plainText)
})

it('text matches after encrypt/decrypt with a key generated from a password', () => {
  const key = cipher.getKeyFromPassword(Buffer.from('mysecretpassword'), cipher.getSalt())
  const cipherText = cipher.encrypt(plainText, key)
  const decryptOutput = cipher.decrypt(cipherText, key)

  expect(decryptOutput.toString('utf8')).toEqual(plainText)
})

it('throws on invalid decrypt', () => {
  const key = cipher.getRandomKey()
  const cipherText = cipher.encrypt(plainText, key)
  expect(() => cipher.decrypt(Buffer.concat([new Buffer(cipherText), new Buffer('a')]), key)).toThrow()
})

