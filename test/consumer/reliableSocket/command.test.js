const commandModule = require('../../../consumer/reliableSocket/command')
const log = require('../../../common/logger')('none')
const { subject } = require('@x/observable')

const serializer = { serialize: x => x }

test("commands resolve when ack is received", async () => {
  const socket = { send: jest.fn() }
  const messages = subject()
  const commandFactory = commandModule(serializer, log)
  const command = commandFactory(1)
  const promise = command.trySend(socket, messages)
  expect(socket.send.mock.calls).toEqual([[{ commandId: 1 }]])
  messages.publish({ commandId: 1, status: 'ack' })
  await expect(promise).resolves.toBeUndefined()
})

test("commands reject when send throws", async () => {
  const socket = { send: () => { throw new Error('test') } }
  const commandFactory = commandModule(serializer, log)
  const command = commandFactory(1)
  await expect(command.trySend(socket, subject())).rejects.toMatchObject({ message: 'test' })
})

test("commands reject when any other response is received", async () => {
  const socket = { send: jest.fn() }
  const messages = subject()
  const commandFactory = commandModule(serializer, log)
  const command = commandFactory(1)
  const promise = command.trySend(socket, messages)
  messages.publish({ commandId: 1, message: 'test' })
  await expect(promise).rejects.toMatchObject({ message: 'test' })
})
