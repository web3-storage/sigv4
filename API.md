## Classes

<dl>
<dt><a href="#Signer">Signer</a></dt>
<dd><p>A signer for generating V4 URLs for AWS s3.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#SigV4Options">SigV4Options</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#SignOptions">SignOptions</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="Signer"></a>

## Signer
A signer for generating V4 URLs for AWS s3.

**Kind**: global class  

* [Signer](#Signer)
    * [new Signer(settings)](#new_Signer_new)
    * [.sign(options)](#Signer+sign) ⇒ <code>URL</code>

<a name="new_Signer_new"></a>

### new Signer(settings)

| Param | Type |
| --- | --- |
| settings | <code>Types.SigV4Options</code> | 

<a name="Signer+sign"></a>

### signer.sign(options) ⇒ <code>URL</code>
Generate a signed URL based on settings and options.

**Kind**: instance method of [<code>Signer</code>](#Signer)  
**Returns**: <code>URL</code> - The signed url.  

| Param | Type |
| --- | --- |
| options | <code>Types.SignOptions</code> | 

<a name="SigV4Options"></a>

## SigV4Options : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| accessKeyId | <code>string</code> | The AWS access key ID for account/IAM. |
| secretAccessKey | <code>string</code> | The AWS access key for account/IAM. |
| region | <code>string</code> | The AWS region to the S3 bucket is in. |
| [cache] | <code>Map.&lt;string, ArrayBuffer&gt;</code> |  |

<a name="SignOptions"></a>

## SignOptions : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| bucket | <code>string</code> |  | The bucket to store the object in. |
| key | <code>string</code> |  | The key of the object in the bucket. |
| [checksum] | <code>string</code> |  | The (sha256) checksum of the object, encoded as base64. |
| [expires] | <code>number</code> | <code>86400</code> | The expiration time of signed URL in seconds. |
| [sessionToken] | <code>string</code> |  | The temporary session token for AWS. |
| [publicRead] | <code>boolean</code> | <code>false</code> | Should the stored object be public-read. |

