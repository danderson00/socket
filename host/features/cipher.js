// from https://stackoverflow.com/questions/6953286/how-to-encrypt-data-that-needs-to-be-decrypted-in-node-js
const crypto = require('crypto')

const ALGORITHM = {
  /**
   * GCM is an authenticated encryption mode that
   * not only provides confidentiality but also
   * provides integrity in a secured way
   * */
  BLOCK_CIPHER: 'aes-256-gcm',

  /**
   * 128 bit auth tag is recommended for GCM
   */
  AUTH_TAG_BYTE_LEN: 16,

  /**
   * NIST recommends 96 bits or 12 bytes IV for GCM
   * to promote interoperability, efficiency, and
   * simplicity of design
   */
  IV_BYTE_LEN: 12,

  /**
   * Note: 256 (in algorithm name) is key size.
   * Block size for AES is always 128
   */
  KEY_BYTE_LEN: 32,

  /**
   * To prevent rainbow table attacks
   * */
  SALT_BYTE_LEN: 16
}

const getIV = () => crypto.randomBytes(ALGORITHM.IV_BYTE_LEN)

module.exports = {
  getRandomKey: getRandomKey = () => crypto.randomBytes(ALGORITHM.KEY_BYTE_LEN),

  /**
   * To prevent rainbow table attacks
   * */
  getSalt: () => crypto.randomBytes(ALGORITHM.SALT_BYTE_LEN),

  /**
   *
   * @param {Buffer} password - The password to be used for generating key
   *
   * To be used when key needs to be generated based on password.
   * The caller of this function has the responsibility to clear
   * the Buffer after the key generation to prevent the password
   * from lingering in the memory
   */
  getKeyFromPassword: (password, salt) => {
    return crypto.scryptSync(password, salt, ALGORITHM.KEY_BYTE_LEN)
  },

  /**
   *
   * @param {Buffer} messageText - The clear text message to be encrypted
   * @param {Buffer} key - The key to be used for encryption
   *
   * The caller of this function has the responsibility to clear
   * the Buffer after the encryption to prevent the message text
   * and the key from lingering in the memory
   */
  encrypt: (messageText, key) => {
    const iv = getIV()
    const cipher = crypto.createCipheriv(
      ALGORITHM.BLOCK_CIPHER, key, iv,
      { 'authTagLength': ALGORITHM.AUTH_TAG_BYTE_LEN })
    let encryptedMessage = cipher.update(messageText)
    encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()])
    return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()])
  },

  /**
   *
   * @param {Buffer} cipherText - Cipher text
   * @param {Buffer} key - The key to be used for decryption
   *
   * The caller of this function has the responsibility to clear
   * the Buffer after the decryption to prevent the message text
   * and the key from lingering in the memory
   */
  decrypt: (cipherText, key) => {
    const authTag = cipherText.slice(-16)
    const iv = cipherText.slice(0, 12)
    const encryptedMessage = cipherText.slice(12, -16)
    const decipher = crypto.createDecipheriv(
      ALGORITHM.BLOCK_CIPHER, key, iv,
      { 'authTagLength': ALGORITHM.AUTH_TAG_BYTE_LEN })
    decipher.setAuthTag(authTag)
    let messageText = decipher.update(encryptedMessage)
    messageText = Buffer.concat([messageText, decipher.final()])
    return messageText
  }
}