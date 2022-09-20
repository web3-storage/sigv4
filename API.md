## Classes

<dl>
<dt><a href="#SigV4">SigV4</a></dt>
<dd><p>This is a class.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#SigV4Options">SigV4Options</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#SignOptions">SignOptions</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="SigV4Options"></a>

## SigV4Options : <code>object</code>

**Kind**: global typedef  
**Properties**

| Name            | Type                                         |
| --------------- | -------------------------------------------- |
| accessKeyId     | <code>string</code>                          |
| secretAccessKey | <code>string</code>                          |
| [sessionToken]  | <code>string</code>                          |
| [publicRead]    | <code>boolean</code>                         |
| region          | <code>string</code>                          |
| [cache]         | <code>Map.&lt;string, ArrayBuffer&gt;</code> |

<a name="SignOptions"></a>

## SignOptions : <code>object</code>

**Kind**: global typedef  
**Properties**

| Name       | Type                |
| ---------- | ------------------- |
| bucket     | <code>string</code> |
| key        | <code>string</code> |
| [checksum] | <code>string</code> |
| [expires]  | <code>number</code> |
