const consumerModule = require('../consumer')
const { fork } = require('child_process')

const setup = test => async () => {
  const socket = fork(__dirname + '/testProcess.js')
  try {
    const api = await consumerModule({ socket }).connect()
    await test({ api })
  } finally {
    socket.kill()
  }
}

test("simple API invocation", setup(async ({ api }) => {
  const result = await api.hello()
  expect(result).toBe('world')
}), 1000000)

