/**
 * Sleep for X ms
 * @async
 * @param {number} time - Number of ms to sleep
 * @returns {Promise<void>} Promise resolved after X ms.
 */
export async function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time)
  })
}

export const LOOKUP =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

/**
 * @param {ArrayBuffer} buffer
 */
export function encodeBase64(buffer) {
  const view = new Uint8Array(buffer)
  const out = []
  for (let i = 0; i < view.length; i += 3) {
    // eslint-disable-next-line unicorn/numeric-separators-style
    const [b1, b2 = 0x10000, b3 = 0x10000] = view.subarray(i, i + 3)
    out.push(
      b1 >> 2,
      ((b1 << 4) | (b2 >> 4)) & 63,
      b2 <= 0xff ? ((b2 << 2) | (b3 >> 6)) & 63 : 64,
      b3 <= 0xff ? b3 & 63 : 64
    )
  }
  return out.map((c) => LOOKUP[c]).join('')
}
