import { sha256 } from '@noble/hashes/sha256'
import fetch from '@web-std/fetch'
import http from 'http'
import { assert, beforeEach, describe, it } from 'vitest'

import { SigV4 } from '../src/index.js'
import { badFetch, badFetchSocket } from './badFetch.js'
import { encodeBase64, sleep } from './utils.js'

/**
 * @typedef {import('./context').CustomContext & import('vitest').TestContext} CustomContext
 */

require('dotenv').config()

describe('Actual Uploads', function () {
  beforeEach(
    /** @param {CustomContext} context */
    (context) => {
      context.data = { key: 'value' }

      context.hash = encodeBase64(sha256(JSON.stringify(context.data)))

      context.signer = new SigV4({
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        region: 'eu-central-1',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      })

      context.bucket = process.env.S3_BUCKET || ''
    }
  )

  describe('fetch', function () {
    it('should sign and upload', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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

    it('should sign and fail upload because hash fails', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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

    it('should sign and fail upload because expired', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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

    it('should sign and succeed upload with content length given', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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
          'content-length': contentLength.toString(),
          'x-amz-checksum-sha256': hash,
        },
      })
      const out = await rsp.text()

      assert.ok(rsp.ok)
    })
  })

  describe('http.request', function () {
    it('should sign and upload when content length does match with "bad fetch".', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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
          'content-length': contentLength.toString(), //actual size is 15
          'x-amz-checksum-sha256': hash,
        },
      })
      assert.ok(rsp.statusCode == 200)
    })

    it.fails(
      'should sign and fail upload when content length is greater than actual content "bad fetch".',
      /** @param {CustomContext} context */
      async ({ signer, hash, data, bucket }) => {
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
            'content-length': (contentLength + 5).toString(), //actual size is 15
            'x-amz-checksum-sha256': hash,
          },
        })
        assert.ok(rsp.statusCode == 200)
      }
    )

    it('should sign and fail upload when content length is less than actual content "bad fetch".', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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

    it('should sign and fail upload when content length is less than actual content "bad fetch".', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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

    it('should sign and fail upload when content hash does not match, but length does "bad fetch".', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
      const fakeData = { key: '' }
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
  })

  describe('manual http.request', function () {
    it('should sign and fail upload when content length less than content, manual writing.', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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
            headers: {
              'content-length': (1).toString(),
              'x-amz-checksum-sha256': hash,
            },
          },
          function (res) {
            res.setEncoding('utf8')
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

  describe('net.socket', function () {
    it('should sign and upload', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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

      assert.ok(rsp.statusCode != 200)
    })

    it('should sign and fail upload when content size is smaller', /** @param {CustomContext} context */ async ({
      signer,
      hash,
      data,
      bucket,
    }) => {
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

      assert.ok(rsp.statusCode != 200)
    })
  })
})
