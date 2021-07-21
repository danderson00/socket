module.exports = options => ({
  serialize: data => {
    const serializeError = error => {
      switch(options.errorDetail) {
        case 'full': return { ...error }
        case 'minimal': return { message: error.message }
        case 'none':
        default: return { message: 'An error occurred' }
      }
    }

    return JSON.stringify(data,
      (key, value) => (value && (value instanceof Error || value.constructor.name === 'Error'))
        ? serializeError(value)
        : value
    )
  },
  deserialize: data => {
    return JSON.parse(data)
  }
})