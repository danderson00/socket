module.exports = (callback, timeout) => {
  const timer = setTimeout(callback, timeout)
  return {
    cancel: () => clearTimeout(timer)
  }
}