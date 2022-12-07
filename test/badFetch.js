import http from 'http'
import net from 'net'

// Since fetch will auto set the content length based on body,
// These are functions for testing sending requests with "bad data".

// A custom http request that allows you to send
// "bad data", for example the incorrect contentlength.
export const badFetch = async (url, options) => {
  options.host = url.host
  options.path = url.pathname + url.search

  return new Promise((resolve) => {
    const body = options.body
    delete options.body

    var req = http.request(options, function (res) {
      res.setEncoding('utf8')
      resolve(res)
    })

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message)
    })

    req.write(body)
    req.end()
  })
}

// Another custom http request using a socket to allow you to send
// any data, including the incorrect content length and etc.
export const badFetchSocket = async (url, options) => {
  const port = 80

  options.host = url.host
  options.path = url.pathname + url.search

  return new Promise((resolve) => {
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

    const socket = new net.Socket()
    socket.connect(port, options.host)

    socket.on('connect', () => {
      socket.write(rawHttpRequest)
    })

    socket.on('data', (data) => {
      resolve(data)

      // Close the connection
      socket.destroy()
    })
  })
}
