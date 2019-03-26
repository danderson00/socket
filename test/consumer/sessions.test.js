const sessionsModule = require('../../consumer/session/sessions')
const { subject } = require('xest')

const socket = () => ({ messages: subject(), send: () => {} })

test("created sessions are added to sessions list", () => {
  const sessions = sessionsModule(socket())
  const s1 = sessions.create()
  const s2 = sessions.create()
  expect(sessions.get()).toEqual([s1, s2])
})

test("sessions are removed from sessions list when disconnected", () => {
  const sessions = sessionsModule(socket())
  const s1 = sessions.create()
  const s2 = sessions.create()
  s1.disconnect()
  expect(sessions.get()).toEqual([s2])
})

test("sessions are removed from sessions list when terminated", () => {
  const sessions = sessionsModule(socket())
  const s1 = sessions.create()
  const s2 = sessions.create()
  s1.terminate()
  expect(sessions.get()).toEqual([s2])
})