const hostModule = require('../host')
const consumerModule = require('../consumer')
const { subject } = require('@x/observable')
const WebSocket = require('ws')

const delay = ms => new Promise(r => setTimeout(r, ms))

const setup = (feature, options, target) => async () => {
  if(!target) {
    target = feature
    feature = undefined
  }
  const server = new WebSocket.Server({ port: 1234 })

  try {
    const log = jest.fn()
    const host = hostModule({ server, log: { level: 'info', writers: [() => log] } })
      .useApi({
        hello: () => new Promise(r => setTimeout(() => r('world'), 10)),
        observableHello:  () => new Promise(r => setTimeout(() => r(subject({ initialValue: 'world' })), 10))
      })

    if(feature) {
      host.useFeature(feature, options)
    }

    let socket
    const consumer = await consumerModule({ socketFactory: () => socket = new WebSocket('ws://localhost:1234') })
    if(feature) {
      consumer.useFeature(feature)
    }
    const connect = async () => {
      const api = await consumer.connect()
      return { socket, api }
    }

    await target({ connect, log, lastLog: () => log.mock.calls[log.mock.calls.length - 1][0] })
  } finally {
    server.close()
  }
}

test("connection count is logged", setup(async ({ connect, log }) => {
  const { socket: socket1 } = await connect()
  const previousLog = behind => log.mock.calls[log.mock.calls.length - behind - 1][0]
  expect(Object.keys(previousLog(2))).toEqual(['timestamp', 'userAgent', 'origin', 'source', 'connectionId', 'level', 'message', 'connectionCount'])
  expect(previousLog(2).connectionCount).toBe(1)
  const { socket: socket2 } = await connect()
  expect(previousLog(2).connectionCount).toBe(2)
  socket1.close()
  await delay(10)
  expect(Object.keys(previousLog(0))).toEqual(['timestamp', 'userAgent', 'origin', 'source', 'connectionId', 'level', 'message', 'connectionCount'])
  expect(previousLog(0).connectionCount).toBe(1)
  socket2.close()
  await delay(10)
  expect(previousLog(0).connectionCount).toBe(0)
}))

test("static calls log session establish and terminate", setup(async ({ connect, log }) => {
  const { api } = await connect()
  const promise = api.hello()
  await delay()
  const previousLog = behind => log.mock.calls[log.mock.calls.length - behind - 1][0]
  const establish = previousLog(0)
  expect(Object.keys(establish)).toEqual(['timestamp', 'userAgent', 'origin', 'source', 'connectionId', 'sessionId', 'operation', 'level', 'message', 'reestablish'])
  expect(establish).toMatchObject({ operation: 'hello', message: 'Session established' })

  await promise
  const terminate = previousLog(0)
  expect(terminate).toMatchObject({ operation: 'hello', message: 'Session terminated', sessionId: establish.sessionId, connectionId: establish.connectionId })
}))

test("observable calls log session establish and terminate", setup(async ({ connect, lastLog }) => {
  const { api } = await connect()
  const promise = api.observableHello()
  await delay()
  const establish = lastLog()
  expect(Object.keys(establish)).toEqual(['timestamp', 'userAgent', 'origin', 'source', 'connectionId', 'sessionId', 'operation', 'level', 'message', 'reestablish'])
  expect(establish).toMatchObject({ operation: 'observableHello', message: 'Session established' })

  const observable = await promise
  expect(lastLog()).toBe(establish)
  observable.disconnect()
  await delay()

  const terminate = lastLog()
  expect(terminate).toMatchObject({ operation: 'observableHello', message: 'Session terminated', sessionId: establish.sessionId, connectionId: establish.connectionId })
}))

test("clientId feature attaches clientId to logs", setup('clientId', { cipherKey: 'abc123' }, async ({ connect, lastLog }) => {
  const { api } = await connect()
  const promise = api.hello()
  await delay()
  const clientId = lastLog().clientId
  expect(clientId).not.toBeUndefined()

  await promise
  expect(lastLog().clientId).toBe(clientId)

  await api.observableHello()
  await delay()
  expect(lastLog().operation).toBe('observableHello')
  expect(lastLog().clientId).toBe(clientId)
}))

test("userAgent is logged", setup(async ({ connect, lastLog }) => {
  await connect()
  expect(lastLog().userAgent).toContain('jsdom')
}))