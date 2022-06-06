const reliableSend = require('../../../consumer/reliableSocket/reliableSend')

const socket = { readyState: 1 }
const log = { error: () => {} }
const delay = ms => new Promise(r => setTimeout(r, ms))
const command = (failCount = 0, succeedAfter = 0) => {
  let failed = 0
  return {
    trySend: () => {
      if(failed === failCount) {
        return delay(succeedAfter)
      } else {
        failed++
        return Promise.reject()
      }
    }
  }
}

test("commands are sent immediately when a socket is provided", async () => {
  const instance = reliableSend()
  await instance.send(command(), socket)
})

test("commands are retried after timeout ms", async () => {
  const instance = reliableSend({ timeout: 10 }, {}, log)
  const promise = instance.send(command(1), socket)
  expect(instance.length()).toBe(1)
  await delay(15)
  expect(instance.length()).toBe(0)
  await promise
})

test("commands are retried immediately when flush is called if command is waiting", async () => {
  const instance = reliableSend({}, {}, log)
  const promise = instance.send(command(1), socket)
  await delay()
  expect(instance.length()).toBe(1)
  instance.flush(socket)
  await delay()
  expect(instance.length()).toBe(0)
  return promise
})

test("commands are not retried when flush is called if command is executing", async () => {
  const instance = reliableSend({}, {}, log)
  const promise = instance.send(command(0, 10), socket)
  await delay()
  expect(instance.length()).toBe(1)
  instance.flush(socket)
  await delay()
  expect(instance.length()).toBe(1)
  return promise
})

test("commands are not retried if a socket is not provided", async () => {
  const instance = reliableSend({ timeout: 0 }, {}, log)
  instance.send(command())
  await delay()
  expect(instance.length()).toBe(1)
  instance.flush()
  await delay()
  expect(instance.length()).toBe(1)
})

test("commands are not retried if a socket is not open", async () => {
  const instance = reliableSend({ timeout: 0 }, {}, log)
  instance.send(command())
  await delay()
  expect(instance.length()).toBe(1)
  instance.flush({ readyState: 2 })
  await delay()
  expect(instance.length()).toBe(1)
})

test("commands are retried if a new socket is provided", async () => {
  const instance = reliableSend({ timeout: 0 }, {}, log)
  instance.send(command())
  await delay()
  expect(instance.length()).toBe(1)
  instance.flush(socket)
  await delay()
  expect(instance.length()).toBe(0)
})
