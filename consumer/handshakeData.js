module.exports = {
  userAgent: () => {
    if (typeof window !== 'undefined') {
      return window.navigator && window.navigator.userAgent
    }
    return 'unknown'
  },
  screen: () => {
    if (typeof window !== 'undefined') {
      return window.screen && { width: window.screen.width, height: window.screen.height }
    }
    return 'unknown'
  }
}