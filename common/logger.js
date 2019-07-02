const logger = require('@x/log')

const defaultOptions = { 
  level: 'warn'
}

module.exports = (options = {}) => logger({ ...defaultOptions, ...options })
