import { sha256 } from '@noble/hashes/sha256'
import fetch from '@web-std/fetch'
import { assert, beforeEach, describe, expect, it } from 'vitest'

import { SigV4 } from '../src/index.js'
import { encodeBase64, sleep } from './utils.js'

describe('Signer', function () {
  describe('#sign()', function () {
    beforeEach((context) => {
      context.signer = new SigV4({
        accessKeyId: 'id',
        region: 'eu-central-1',
        secretAccessKey: 'secret',
      })
    })

    it('should sign', function ({ signer }) {
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

    it('should sign with checksum', function ({ signer }) {
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

    it('should sign with expires', function ({ signer }) {
      const url = signer.sign({
        bucket: 'bucket-name',
        key: 'name',
        checksum: 'sss',
        expires: 1000,
      })

      const search = url.searchParams
      assert.equal(search.get('X-Amz-Expires'), '1000')
    })

    it('should sign with session token when given', function ({ signer }) {
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

    it('should sign with public read when true', function ({ signer }) {
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

    it('should sign with size when given', function ({ signer }) {
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

    it('should NOT sign with size when size is 0', function ({ signer }) {
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

    it('should NOT sign with size when not given', function ({ signer }) {
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
      context.data = { key: 'value' }

      context.hash = encodeBase64(sha256(JSON.stringify(context.data)))

      context.signer = new SigV4({
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        region: 'eu-central-1',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      })
    })
    it('should sign and upload', async function ({ signer, hash, data }) {
      const url = signer.sign({
        bucket: process.env.S3_BUCKET || '',
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
    }) {
      const url = signer.sign({
        bucket: process.env.S3_BUCKET || '',
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
    }) {
      const url = signer.sign({
        bucket: process.env.S3_BUCKET || '',
        key: `testing/test-file-${Date.now()}.json`,
        checksum: hash,
        expires: 1,
      })

      await sleep(500)
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
  })
})
