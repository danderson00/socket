module.exports = options => {
  if(typeof window === 'undefined' || window.WebSocket === undefined) {
    throw new Error("No default WebSocket implementation found. You must specify a socketFactory")
  }

  return () => new window.WebSocket(options.url || defaultUrl())
}

const defaultUrl = () => `${
  window.location.protocol === 'https:' ? 'wss:' : 'ws:'
}//${
  window.location.hostname === 'localhost'
    ? 'localhost:3001/'
    : `${window.location.host}${window.location.pathname}`
}`
