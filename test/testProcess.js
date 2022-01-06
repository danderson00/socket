const hostModule = require('../host')
const integrationApi = require('./integration.api')

const host = hostModule({ socket: process, log: { level: 'fatal' } })
integrationApi.forEach(api => host.useApi(api))

new Promise(() => {})