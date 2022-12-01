import {sha256} from '@noble/hashes/sha256'
import fetch from '@web-std/fetch'
import http from 'http'
import {assert, beforeEach, describe, expect, it, test} from 'vitest'

import {SigV4} from '../src/index.js'
import {badFetch, badFetchSocket} from './badFetch.js'
import {encodeBase64, sleep} from './utils.js'

require('dotenv').config()

describe('Signer', function () {
  describe('#sign()', function () {
    beforeEach((context) => {
      context.signer = new SigV4({
        accessKeyId: 'id',
        region: 'eu-central-1',
        secretAccessKey: 'secret',
      })
    })

    it('should sign', function ({signer}) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
      })

      assert.equal(url.host, 'bucket-name.s3.eu-central-1.amazonaws.com')
      assert.equal(url.pathname, '/name')
      const search = url.searchParams
      assert.equal(search.get('X-Amz-Expires'), '86400')
      assert.equal(search.get('X-Amz-Algorithm'), 'AWS4-HMAC-SHA256')
      assert.match(search.get('X-Amz-Credential') || '', /aws4_request/)
      assert.equal(search.get('X-Amz-SignedHeaders'), 'host')
      assert.ok(typeof search.get('X-Amz-Signature') === 'string')
    })

    it('should sign with checksum', function ({signer}) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
      })

      const search = url.searchParams
      assert.equal(
        search.get('X-Amz-SignedHeaders'),
        'host;x-amz-checksum-sha256'
      )
    })

    it('should sign with expires', function ({signer}) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
      })

      const search = url.searchParams
      assert.equal(search.get('X-Amz-Expires'), '1000')
    })

    it('should sign with session token when given', function ({signer}) {
      const token = 'token_123'
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
        sessionToken: token,
      })

      const search = url.searchParams
      expect(search.get('X-Amz-Security-Token')).toBe(token)
    })

    it('should sign NOT with session token when NOT given', function ({
      signer,
    }) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
      })

      const search = url.searchParams
      expect(search.get('X-Amz-Security-Token')).toBeNull()
    })

    it('should sign with public read when true', function ({signer}) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
        publicRead: true,
      })

      const search = url.searchParams
      expect(search.get('x-amz-acl')).toBe('public-read')
    })

    it('should sign NOT with public read when not given', function ({
      signer,
    }) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
      })

      const search = url.searchParams
      expect(search.get('x-amz-acl')).toBeNull()
    })

    it('should sign with size when given', function ({signer}) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
        contentLength: 1024,
      })

      const search = url.searchParams
      assert.equal(
        search.get('X-Amz-SignedHeaders'),
        'content-length;host;x-amz-checksum-sha256'
      )
    })

    //     it('should sign with int size when given float', function ({ signer }) {
    //       const url = signer.sign({
    //         bucket: 'bucket-name',
    //         key: 'name',
    //         checksum: 'sss',
    //         expires: 1000,
    //         contentLength: 1024.213,
    //       })
    //
    //       const search = url.searchParams
    //       console.log('search', search)
    //       expect(search.get('Content-Length')).toBe('1024')
    //     })

    it('should NOT sign with size when size is 0', function ({signer}) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
        contentLength: 0,
      })

      const search = url.searchParams
      assert.equal(
        search.get('X-Amz-SignedHeaders'),
        'host;x-amz-checksum-sha256'
      )
    })

    it('should NOT sign with size when not given', function ({signer}) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
      })

      const search = url.searchParams
      assert.equal(
        search.get('X-Amz-SignedHeaders'),
        'host;x-amz-checksum-sha256'
      )
    })
  })

  describe.skip('s3 integration needs .env and cors setup', function () {
    beforeEach((context) => {
      context.data = {key: 'value'}

      context.hash = encodeBase64(sha256(JSON.stringify(context.data)))

      context.signer = new SigV4({
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        region: 'eu-central-1',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      })

      context.bucket = process.env.S3_BUCKET || ''
    })

    it('should sign and upload', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}.json`,
        checksum: hash,
        expires: 1000,
      })

      const rsp = await fetch(url.toString(), {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'x-amz-checksum-sha256': hash,
        },
      })

      assert.ok(rsp.ok)
    })

    it('should sign and fail upload because hash fails', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}.json`,
        checksum: hash,
        expires: 1000,
      })

      const rsp = await fetch(url.toString(), {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'x-amz-checksum-sha256': hash + 'ss',
        },
      })
      const out = await rsp.text()
      assert.ok(out.includes('SignatureDoesNotMatch'))
    })

    it('should sign and fail upload because expired', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}.json`,
        checksum: hash,
        expires: 1,
      })

      await sleep(1000)
      const rsp = await fetch(url.toString(), {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'x-amz-checksum-sha256': hash,
        },
      })
      const out = await rsp.text()
      assert.ok(out.includes('Request has expired'))
    })

    it('should sign and succeed upload with content length given', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const content = JSON.stringify(data)
      const contentLength = Buffer.from(content).byteLength
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}.json`,
        checksum: hash,
        expires: 1000,
        contentLength,
      })

      await sleep(500)
      const rsp = await fetch(url.toString(), {
        method: 'PUT',
        body: content,
        headers: {
          'content-length': contentLength,
          'x-amz-checksum-sha256': hash,
        },
      })
      const out = await rsp.text()
      console.log(out)

      assert.ok(rsp.ok)
      //       assert.ok(out.includes('Request has expired'))
    })

    it('should sign and upload when content length does match with "bad fetch".', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const content = JSON.stringify(data)
      const contentLength = Buffer.from(content).byteLength
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}-invalid-size.json`,
        checksum: hash,
        expires: 1000,
        contentLength,
      })

      const rsp = await badFetch(url, {
        method: 'PUT',
        body: content,
        contentEncoding: 'base64',
        contentType: 'application/json',
        headers: {
          'content-length': contentLength, //actual size is 15
          'x-amz-checksum-sha256': hash,
        },
      })
      assert.ok(rsp.statusCode == 200)
    })

    it.fails(
      'should sign and fail upload when content length is greater than actual content "bad fetch".',
      async function ({signer, hash, data, bucket}) {
        const content = JSON.stringify(data)
        const contentLength = Buffer.from(content).byteLength
        const url = signer.sign({
          bucket,
          key: `testing/test-file-${Date.now()}-invalid-size.json`,
          checksum: hash,
          expires: 1000,
          contentLength: contentLength + 5,
        })

        const rsp = await badFetch(url, {
          method: 'PUT',
          body: content,
          contentEncoding: 'base64',
          contentType: 'application/json',
          headers: {
            'content-length': contentLength + 5, //actual size is 15
            'x-amz-checksum-sha256': hash,
          },
        })
        assert.ok(rsp.statusCode == 200)
      }
    )

    it('should sign and fail upload when content length is less than actual content "bad fetch".', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const content = JSON.stringify(data)
      const contentLength = Buffer.from(content).byteLength
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}-invalid-size.json`,
        checksum: hash,
        expires: 1000,
        contentLength: contentLength - 5,
      })

      const rsp = await badFetch(url, {
        method: 'PUT',
        body: content,
        contentEncoding: 'base64',
        contentType: 'application/json',
        headers: {
          'content-length': contentLength - 5, //actual size is 15
          'x-amz-checksum-sha256': hash,
        },
      })

      assert.ok(rsp.statusCode != 200)
    })

    it('should sign and fail upload when content length is less than actual content "bad fetch".', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const content = JSON.stringify(data)
      const contentLength = Buffer.from(content).byteLength
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}-invalid-size.json`,
        checksum: hash,
        expires: 1000,
        contentLength: contentLength - 5,
      })

      const rsp = await badFetch(url, {
        method: 'PUT',
        body: content,
        contentEncoding: 'base64',
        contentType: 'application/json',
        headers: {
          'content-length': contentLength - 5, //actual size is 15
          'x-amz-checksum-sha256': hash,
        },
      })
      assert.ok(rsp.statusCode != 200)
    })

    it('should sign and fail upload when content hash does not match, but length does "bad fetch".', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const fakeData = {key: ''}
      const content = JSON.stringify(fakeData)
      const contentLength = Buffer.from(content).byteLength
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}-invalid-size.json`,
        checksum: hash,
        expires: 1000,
        contentLength,
      })

      const rsp = await badFetch(url, {
        method: 'PUT',
        body: content,
        contentEncoding: 'base64',
        contentType: 'application/json',
        headers: {
          'content-length': contentLength,
          'x-amz-checksum-sha256': hash,
        },
      })
      assert.ok(rsp.statusCode != 200)
    })

    it('should sign and fail upload when content length less than content, manual writing.', async function ({
      signer,
      hash,
      data,
      bucket,
    }) {
      const content = JSON.stringify(data)
      const contentLength = Buffer.from(content).byteLength
      const url = signer.sign({
        bucket,
        key: `testing/test-file-${Date.now()}-invalid-size.json`,
        checksum: hash,
        expires: 1000,
        contentLength: 1,
      })

      await new Promise((resolve) => {
        var req = http.request(
          {
            host: url.host,
            path: url.pathname + url.search,
            method: 'PUT',
            body: content,
            contentEncoding: 'base64',
            contentType: 'application/json',
            headers: {
              'content-length': 1,
              'x-amz-checksum-sha256': hash,
            },
          },
          function (res) {
            console.log('STATUS: ' + res.statusCode)
            console.log('HEADERS: ' + JSON.stringify(res.headers))

            res.setEncoding('utf8')
            res.on('data', function (chunk) {
              console.log('BODY: ' + chunk)
            })

            resolve(res)
          }
        )

        req.on('error', function (e) {
          console.log('problem with request: ' + e.message)
        })

        req.write(content)
        req.end()
      })
    })
  })

  it('should sign and upload, "manual writing with socket".', async function ({
    signer,
    hash,
    data,
    bucket,
  }) {
    const content = JSON.stringify(data)
    const contentLength = Buffer.from(content).byteLength
    const url = signer.sign({
      bucket,
      key: `testing/test-file-${Date.now()}-invalid-size.json`,
      checksum: hash,
      expires: 1000,
      contentLength: contentLength,
    })

    //       const rsp = await badFetchSocket(new URL('http://127.0.0.1'), {
    const rsp = await badFetchSocket(url, {
      method: 'PUT',
      body: content,
      contentEncoding: 'base64',
      contentType: 'application/json',
      headers: {
        'content-length': contentLength, //actual size is 15
        'x-amz-checksum-sha256': hash,
      },
    })

    console.log(Buffer.from(rsp).toString())
    assert.ok(rsp.statusCode != 200)
  })

  it('should sign and fail upload when content size is smaller, "manual writing with socket".', async function ({
    signer,
    hash,
    data,
    bucket,
  }) {
    const content = JSON.stringify(data)
    const contentLength = Buffer.from(content).byteLength
    const url = signer.sign({
      bucket,
      key: `testing/test-file-${Date.now()}-invalid-size.json`,
      checksum: hash,
      expires: 1000,
      contentLength: contentLength - 5,
    })

    //       const rsp = await badFetchSocket(new URL('http://127.0.0.1'), {
    const rsp = await badFetchSocket(url, {
      method: 'PUT',
      body: content,
      contentEncoding: 'base64',
      contentType: 'application/json',
      headers: {
        'content-length': contentLength - 5, //actual size is 15
        'x-amz-checksum-sha256': hash,
      },
    })

    console.log(Buffer.from(rsp).toString())
    assert.ok(rsp.statusCode != 200)
  })
})
})
