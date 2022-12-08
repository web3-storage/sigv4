import { TestContext } from 'vitest'

import Signer from '../src/index.js'

export interface CustomContext extends TestContext {
  signer: Signer
  data?: any
  hash: string
  bucket: string
}
