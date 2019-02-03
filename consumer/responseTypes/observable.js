const { subject } = require('xest')

module.exports = {
  handler: (initialValue, { terminate }) => {
    const observable = subject({ initialValue })
    observable.disconnect = () => terminate()
    
    return {
      value: observable,
      update: data => observable.publish(data.value)
    }
  }
}