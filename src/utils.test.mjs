// node --test src/utils.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fmtElapsed, fmtPace, uvBand, monthGrid } from './utils.js'

test('fmtElapsed', () => {
  assert.equal(fmtElapsed(0), '00:00')
  assert.equal(fmtElapsed(65), '01:05')
  assert.equal(fmtElapsed(600), '10:00')
})

test('fmtPace', () => {
  assert.equal(fmtPace(0, 0), "--'--\"")       // 거리 0에서 0 나눗셈 금지
  assert.equal(fmtPace(300, 1), "5'00\"")
  assert.equal(fmtPace(1500, 5), "5'00\"")
})

test('uvBand', () => {
  assert.equal(uvBand(2), '낮음')
  assert.equal(uvBand(5), '보통')
  assert.equal(uvBand(7), '높음')
  assert.equal(uvBand(8), '매우 높음')
})

test('monthGrid — 2026년 8월은 토요일 시작, 31일까지', () => {
  const g = monthGrid(2026, 7)
  assert.equal(g.length, 6 + 31)               // 앞 빈칸 6개(일~금) + 31일
  assert.equal(g[6], 1)
  assert.equal(g.at(-1), 31)
})
