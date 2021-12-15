module.exports = () => {
  if(typeof window !== 'undefined') {
    return window.navigator && window.navigator.userAgent
  }
  return 'unknown'
}