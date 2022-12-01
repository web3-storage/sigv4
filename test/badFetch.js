import http from 'http'
import net from 'net'

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

export const badFetchSocket = async (url, options) => {
  //   const port = 8080
  const port = 80

  options.host = url.host
  options.path = url.pathname + url.search

  return new Promise((resolve) => {
    console.log('req started', options)
    const body = options.body
    delete options.body

    // Instead of \n as a line break we use \r\n
    // Because that's how it's defined in the http specification
    // https://stackoverflow.com/a/5757349/6199444
    let rawHttpRequest = `${options.method} ${options.path} HTTP/1.1\r\n`
    rawHttpRequest += `host: ${options.host}\r\n`
    rawHttpRequest += `content-encoding: ${options.contentEncoding}\r\n`
    rawHttpRequest += `content-type: ${options.contentType}\r\n`
    rawHttpRequest += `accept: */*\r\n`

    if (options.headers) {
      for (const header of Object.entries(options.headers)) {
        rawHttpRequest += `${header[0]}: ${header[1]}\r\n`
      }
    }

    rawHttpRequest += `\r\n`
    rawHttpRequest += `${body}`
    rawHttpRequest += `\r\n\r\n`

    console.log('raw req\n', rawHttpRequest)

    const socket = new net.Socket()
    socket.connect(port, options.host)
    console.log('connection attempted')

    socket.on('connect', () => {
      console.log(`Connected to ${options.host}:${port}`)
      console.log(`Local port ${socket.localPort}\n`)

      socket.write(rawHttpRequest)
    })

    socket.on('data', (data) => {
      resolve(data)

      // Close the connection
      socket.destroy()
    })
  })
}

// badFetchSocket(new URL('http://127.0.0.1'), {
//   method: 'PUT',
//   body: 'hello',
//   contentEncoding: 'base64',
//   contentType: 'application/text',
//   contentLength: 1,
//   headers: {
//     'content-length': 5, //actual size is 15
//     'x-amz-checksum-sha256': 12312321,
//   },
// })
