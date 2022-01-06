const hostModule = require('../host')
const consumerModule = require('../consumer')
const integrationApi = require('./integration.api')
const WebSocket = require('ws')
const { fork } = require('child_process')

const websocket = target => async () => {
  const server = new WebSocket.Server({ port: 1234 })

  try {
    const host = hostModule({ server, log: { level: 'fatal' } })
    integrationApi.forEach(api => host.useApi(api))
    const api = await consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234') }).connect()
    await target(api)
  } finally {
    server.close()
  }
}

const childProcess = target => async () => {
  const socket = fork(__dirname + '/testProcess.js')
  try {
    const api = await consumerModule({ socket }).connect()
    await target(api)
  } finally {
    socket.kill()
  }
}

describe.each([
  ['websocket', websocket],
  // TODO: this is broken!
  // ['child process', childProcess],
])('%s', (name, setup) => {

  test("synchronous API", setup(async api => {
    const result = await api.synchronous()
    expect(result).toBe('world')
  }))

  test("asynchronous API", setup(async api => {
    const result = await api.asynchronous()
    expect(result).toBe('world')
  }))

  test("operation parameters", setup(async api => {
    const result = await api.parameters({ b: 'wor', c: 1 }, 'd')
    expect(result).toBe('wor1d')
  }))

  test("errors result in rejected promises", setup(async api => {
    const promise = api.error()
    await expect(promise).rejects.toEqual({ message: 'world' })
  }))

  test("rejected promises are returned", setup(async api => {
    const promise = api.rejection()
    await expect(promise).rejects.toEqual({ message: 'world' })
  }))

  test("multiple APIs", setup(async api => {
    expect(await api.multiple('test')).toBe("'test'")
  }))
})
