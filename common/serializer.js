module.exports = () => ({
  serialize: data => {
    return JSON.stringify(data)
  },
  deserialize: data => {
    return JSON.parse(data)
  }
})