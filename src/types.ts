/**
 * @interface SigV4Options
 * @property accessKeyId - The AWS access key ID for account/IAM.
 * @property secretAccessKey - The AWS access key for account/IAM.
 * @property region - The AWS region to the S3 bucket is in.
 * @property [cache]
 */
export interface SigV4Options {
  accessKeyId: string
  secretAccessKey: string
  region: string
  cache?: Map<string, ArrayBuffer>
}
/**
 * @interface SignOptions
 * @property bucket - The bucket to store the object in.
 * @property key - The key of the object in the bucket.
 * @property [checksum] - The (sha256) checksum of the object, encoded as base64.
 * @property [expires=86400] - The expiration time of signed URL in seconds.
 * @property [sessionToken] - The temporary session token for AWS.
 * @property [publicRead = false] - Should the stored object be public-read.
 */
export interface SignOptions {
  bucket: string
  key: string
  checksum?: string
  expires?: number
  sessionToken?: string
  publicRead?: boolean
}
