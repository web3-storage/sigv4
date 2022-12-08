## Classes

<dl>
<dt><a href="#Signer">Signer</a></dt>
<dd><p>A signer for generating V4 URLs for AWS s3.</p>
</dd>
</dl>

## Interfaces

<dl>
<dt><a href="#SigV4Options">SigV4Options</a></dt>
<dd></dd>
<dt><a href="#SignOptions">SignOptions</a></dt>
<dd></dd>
</dl>

<a name="SigV4Options"></a>

## SigV4Options
**Kind**: global interface  
**Properties**

| Name | Description |
| --- | --- |
| accessKeyId | The AWS access key ID for account/IAM. |
| secretAccessKey | The AWS access key for account/IAM. |
| region | The AWS region to the S3 bucket is in. |
| [cache] |  |

<a name="SignOptions"></a>

## SignOptions
**Kind**: global interface  
**Properties**

| Name | Default | Description |
| --- | --- | --- |
| bucket |  | The bucket to store the object in. |
| key |  | The key of the object in the bucket. |
| [checksum] |  | The (sha256) checksum of the object, encoded as base64. |
| [expires] | <code>86400</code> | The expiration time of signed URL in seconds. |
| [sessionToken] |  | The temporary session token for AWS. |
| [publicRead] | <code>false</code> | Should the stored object be public-read. |
| [contentLength] | <code>0</code> | The content length of the stored object. |

<a name="Signer"></a>

## Signer
A signer for generating V4 URLs for AWS s3.

**Kind**: global class  

* [Signer](#Signer)
    * [new Signer(settings)](#new_Signer_new)
    * [.canonicalHeaders](#Signer+canonicalHeaders) : <code>Array.&lt;string&gt;</code>
    * [.headersNames](#Signer+headersNames) : <code>Array.&lt;string&gt;</code>
    * [.sign(options)](#Signer+sign) ⇒ <code>URL</code>

<a name="new_Signer_new"></a>

### new Signer(settings)

| Param | Type |
| --- | --- |
| settings | <code>Types.SigV4Options</code> | 

<a name="Signer+canonicalHeaders"></a>

### signer.canonicalHeaders : <code>Array.&lt;string&gt;</code>
**Kind**: instance property of [<code>Signer</code>](#Signer)  
<a name="Signer+headersNames"></a>

### signer.headersNames : <code>Array.&lt;string&gt;</code>
**Kind**: instance property of [<code>Signer</code>](#Signer)  
<a name="Signer+sign"></a>

### signer.sign(options) ⇒ <code>URL</code>
Generate a signed URL based on settings and options.

**Kind**: instance method of [<code>Signer</code>](#Signer)  
**Returns**: <code>URL</code> - The signed url.  

| Param | Type |
| --- | --- |
| options | <code>Types.SignOptions</code> | 

