const queue = require('../../../consumer/reliableSocket/queue')
const log = require('../../../common/logger')('none')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

test("adding to queue with socket and messages immediately attempts to execute trySend", () => {
  const trySend = jest.fn(() => Promise.resolve())
  queue({}, true, log).add({ trySend }, true)
  expect(trySend.mock.calls.length).toBe(1)
})

test("commands are queued while rejecting", () => {
  const trySend = jest.fn(() => Promise.reject())
  const q = queue({}, true, log)
  q.add({ trySend })
  q.add({ trySend })
  expect(q.length()).toBe(2)
})

test("commands are flushed by calling flush", async () => {
  let resolve = false
  const trySend = jest.fn(() => resolve ? Promise.resolve() : Promise.reject())
  const q = queue({}, true, log)
  q.add({ trySend }, true)
  resolve = true
  q.add({ trySend }, true)
  await q.flush()
  expect(trySend.mock.calls.length).toBe(3)
  expect(q.length()).toBe(0)
})

test("commands are reexecuted in order after failures", async () => {
  let resolve = false
  const send = jest.fn(() => resolve ? Promise.resolve() : Promise.reject())
  const q = queue({}, true, log)
  q.add({ trySend: () => send(1) }, true)
  resolve = true
  q.add({ trySend: () => send(2) }, true)
  await q.flush()
  expect(send.mock.calls).toEqual([[1], [1], [2]])
  expect(q.length()).toBe(0)
})

test("commands are executed in order if multiple are queued concurrently", async () => {
  const send = jest.fn(() => delay(5))
  const q = queue({}, true, log)
  q.add({ trySend: () => send(1) }, true)
  q.add({ trySend: () => send(2) }, true)
  await delay(15)
  expect(send.mock.calls).toEqual([[1], [2]])
})