module.exports = options => {
  if(!options.url) {
    throw new Error("You must specify a url")
  }

  if(typeof window === 'undefined' || window.WebSocket === undefined) {
    throw new Error("No default WebSocket implementation found. You must specify a socketFactory")
  }

  return () => new window.WebSocket(options.url)
}