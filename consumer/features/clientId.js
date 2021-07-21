const STORAGE_KEY = '__socket__clientId'

module.exports = () => () => {
  const clientId = window.localStorage.getItem(STORAGE_KEY)
  return {
    name: 'clientId',
    handshakeData: clientId,
    initialise: ({ handshakeData }) => {
      window.localStorage.setItem(STORAGE_KEY, handshakeData.clientId)
      return {}
    }
  }
}