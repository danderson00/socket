const connect = require('../../consumer/connect')

test("connect returns wrapped api", async () => {
  const create = jest.fn().mockReturnValue(Promise.resolve(
    { operations: [{ name: 'test' }] }
  ))
  
  const { api } = await connect({ create })
  expect(api.test).toBeInstanceOf(Function)

  api.test(1, 'test')
  expect(create.mock.calls[1]).toEqual(['operation', { operation: 'test', parameters: [1, 'test'] }, undefined])
})