// node --test src/api/client.test.mjs
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const store = new Map()
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
}

const { request, setTokens, getTokens, ApiError, localDateTime } = await import('./client.js')

const ok = (data) => ({ status: 200, ok: true, json: async () => ({ success: true, data, error: null }) })
const fail = (status, code) => ({
  status,
  ok: false,
  json: async () => ({ success: false, data: null, error: { code, message: 'nope' } }),
})

let calls
beforeEach(() => {
  store.clear()
  calls = []
})

test('성공 응답은 껍데기를 벗겨 data만 준다', async () => {
  globalThis.fetch = async (url, init) => (calls.push([url, init]), ok({ uvIndex: 8 }))
  assert.deepEqual(await request('GET', '/running-sessions/prepare', { query: { lat: 1, lng: 2 } }), { uvIndex: 8 })
  assert.match(calls[0][0], /\/running-sessions\/prepare\?lat=1&lng=2$/)
})

test('실패 응답은 error.code를 단 ApiError로 던진다', async () => {
  globalThis.fetch = async () => fail(401, 'E4011')
  await assert.rejects(request('POST', '/auth/login', { auth: false }), (e) => e instanceof ApiError && e.code === 'E4011')
})

test('E4010이면 refresh 후 1회 재시도한다', async () => {
  setTokens({ accessToken: 'old', refreshToken: 'r1' })
  globalThis.fetch = async (url, init) => {
    calls.push(url)
    if (url.endsWith('/auth/refresh')) return ok({ accessToken: 'new', expiresIn: 3600 })
    return init.headers.Authorization === 'Bearer new' ? ok({ greeting: 'hi' }) : fail(401, 'E4010')
  }
  assert.deepEqual(await request('GET', '/home'), { greeting: 'hi' })
  assert.equal(calls.length, 3) // 실패 → refresh → 재시도
  assert.equal(getTokens().accessToken, 'new')
})

test('refresh도 실패하면 토큰을 비우고 원래 에러를 던진다', async () => {
  setTokens({ accessToken: 'old', refreshToken: 'r1' })
  globalThis.fetch = async () => fail(401, 'E4010')
  await assert.rejects(request('GET', '/home'), (e) => e.code === 'E4010')
  assert.equal(getTokens(), null)
})

test('localDateTime은 타임존 없는 LocalDateTime 형식', () => {
  assert.equal(localDateTime(new Date(2026, 7, 15, 8, 5, 3)), '2026-08-15T08:05:03')
})
