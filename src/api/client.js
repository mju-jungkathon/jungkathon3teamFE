// 백엔드 공통 껍데기({ success, data, error })를 벗겨서 data만 돌려주는 얇은 fetch 래퍼.
// 실패는 전부 ApiError로 던진다 — 화면에서는 err.code로 분기하면 된다(docs/API.md 0.3).

const BASE = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'aftergrow.tokens'

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function getTokens() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(TOKEN_KEY) || 'null')
  } catch {
    return null
  }
}

export function setTokens(tokens) {
  if (tokens) globalThis.localStorage?.setItem(TOKEN_KEY, JSON.stringify(tokens))
  else globalThis.localStorage?.removeItem(TOKEN_KEY)
}

// refresh까지 실패했을 때(= 로그인 화면으로 보내야 할 때) 호출된다. App에서 한 번 등록.
let onUnauthorized = null
export function setOnUnauthorized(fn) {
  onUnauthorized = fn
}

// 서버는 LocalDateTime(타임존 없음)을 받는다. toISOString()은 UTC + 'Z'라 파싱이 어긋난다.
export function localDateTime(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function qs(query) {
  if (!query) return ''
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) p.append(k, v)
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function raw(method, path, { body, query, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? getTokens()?.accessToken : null
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(BASE + path + qs(query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('E_NETWORK', '네트워크에 연결할 수 없어요', 0)
  }

  if (res.status === 204) return null
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.error?.code || 'E5000',
      json?.error?.message || '알 수 없는 오류가 발생했어요',
      res.status,
    )
  }
  return json.data
}

// 폴링 중 401이 여러 개 동시에 터져도 refresh는 한 번만 나가게 묶는다.
let refreshing = null
function refresh() {
  const refreshToken = getTokens()?.refreshToken
  if (!refreshToken) return Promise.reject(new ApiError('E4010', '로그인이 필요해요', 401))
  if (!refreshing) {
    refreshing = raw('POST', '/auth/refresh', { body: { refreshToken }, auth: false })
      .then((d) => setTokens({ ...getTokens(), accessToken: d.accessToken, expiresIn: d.expiresIn }))
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

export async function request(method, path, opts = {}) {
  try {
    return await raw(method, path, opts)
  } catch (err) {
    // E4010(토큰 없음/만료)만 재발급 후 1회 재시도. E4011(비번 틀림)은 그대로 던진다.
    if (err.code !== 'E4010' || opts.auth === false || opts.retried) throw err
    try {
      await refresh()
    } catch {
      setTokens(null)
      onUnauthorized?.()
      throw err
    }
    return raw(method, path, { ...opts, retried: true })
  }
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body, opts) => request('POST', path, { body, ...opts }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path, body) => request('DELETE', path, { body }),
}
