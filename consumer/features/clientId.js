const STORAGE_KEY = '__socket__clientId'

module.exports = () => () => ({
  name: 'clientId',
  handshakeData: () => window.localStorage.getItem(STORAGE_KEY),
  initialise: ({ handshakeData }) => {
    window.localStorage.setItem(STORAGE_KEY, handshakeData.clientId)
    return {}
  }
})
