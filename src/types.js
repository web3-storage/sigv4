/**
 * @typedef {object} SigV4Options
 * @property {string} accessKeyId - The AWS access key ID for account/IAM.
 * @property {string} secretAccessKey - The AWS access key for account/IAM.
 * @property {string} region - The AWS region to the S3 bucket is in.
 * @property {Map<string,ArrayBuffer>} [cache]
 */

/**
 * @typedef {object} SignOptions
 * @property {string} bucket - The bucket to store the object in.
 * @property {string} key - The key of the object in the bucket.
 * @property {string} [checksum] - The (sha256) checksum of the object, encoded as base64.
 * @property {number} [expires=86400] - The expiration time of signed URL in seconds.
 * @property {string} [sessionToken] - The temporary session token for AWS.
 * @property {boolean} [publicRead = false] - Should the stored object be public-read.
 */
