const logger = require('@danderson00/log')

const defaultOptions = { 
  level: 'warn'
}

module.exports = (options = {}) => logger({ ...defaultOptions, ...options })
