// node --test src/rppg.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeBpmResult } from './rppg.js'

test('computeBpmResult — 72bpm(1.2Hz) 합성 신호를 GOOD으로 인식한다', () => {
  const fps = 20
  const freqHz = 1.2 // 72 bpm
  const samples = Array.from({ length: fps * 12 }, (_, i) => 128 + 10 * Math.sin(2 * Math.PI * freqHz * (i / fps)))

  const result = computeBpmResult(samples, fps)
  assert.equal(result.signalQuality, 'GOOD')
  assert.ok(Math.abs(result.avgBpm - 72) <= 3, `expected ~72bpm, got ${result.avgBpm}`)
  assert.ok(result.maxBpm >= result.avgBpm)
})

test('computeBpmResult — 변화 없는 신호는 POOR 폴백을 반환한다', () => {
  const result = computeBpmResult(Array(240).fill(128), 20)
  assert.equal(result.signalQuality, 'POOR')
  assert.equal(result.avgBpm, 70)
  assert.equal(result.maxBpm, 70)
})

test('computeBpmResult — 샘플이 4초 미만이면 POOR 폴백을 반환한다', () => {
  const result = computeBpmResult(Array(10).fill(128), 20)
  assert.equal(result.signalQuality, 'POOR')
})
