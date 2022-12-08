### SIGv4

A library for signing uploads for AWS using the signature v4.

[API docs](API.md)


#### Testing
You can run the "actual uploads" tests with the envvar NODE_DEBUG=http or NODE_DEBUG=net
for more information.

If you are wanting to test the actual uploads, you need to setup
an .env file that contains

```sha
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
```
