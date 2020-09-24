const hostModule = require('../host')
const host = hostModule({ socket: process })
host.useApi({ hello: () => 'world' })

setInterval(() => {}, 1000 * 60 * 60)