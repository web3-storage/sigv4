import http from 'http'

// import { base64pad } from 'multiformats/bases/base64'
// import { sha256 } from 'multiformats/hashes/sha2'

// async function sha(bytes) {
//   const sha = await sha256.digest(bytes)
//   return sha.digest
// }

// const checksum = base64pad.baseEncode(await sha(file))

export const badFetch = async (url, options) => {
  options.host = url.host
  options.path = url.pathname + url.search

  return new Promise((resolve) => {
    console.log('req started', options)
    const body = options.body
    delete options.body

    var req = http.request(options, function (res) {
      console.log('STATUS: ' + res.statusCode)
      console.log('HEADERS: ' + JSON.stringify(res.headers))

      res.setEncoding('utf8')
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk)
      })

      resolve(res)
    })

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message)
    })

    req.write(body)
    req.end()
  })
}
