import BigInteger from '../math/bigInteger.js'
import { generatePrime } from '../math/prime.js'

export class DHCrypto {
  constructor() {
    this.params = null
  }

  generateParams(bits = 256) {
    const p = new BigInteger(generatePrime(bits))
    const g = new BigInteger(2)
    
    this.params = {
      p: p.toString(),
      g: g.toString()
    }
    
    return this.params
  }

  generateKeyPair(p, g) {
    const pBig = new BigInteger(p)
    const gBig = new BigInteger(g)
    
    const privateKey = new BigInteger(generatePrime(128))
    
    const publicKey = gBig.pow(privateKey.value, pBig.value)
    
    return {
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString()
    }
  }

  deriveSharedSecret(privateKey, otherPublicKey, p) {
    const privBig = new BigInteger(privateKey)
    const pubBig = new BigInteger(otherPublicKey)
    const pBig = new BigInteger(p)
    
    const sharedSecret = pubBig.pow(privBig.value, pBig.value)
    
    return sharedSecret.toString()
  }

  mitmAttack(p, g, alicePublic, bobPublic, returnSteps = false) {
    const steps = []
    
    steps.push({
      type: 'setup',
      description: 'Alice 和 Bob 开始 DH 密钥交换',
      alicePublic,
      bobPublic
    })
    
    const mitmPrivate = new BigInteger(generatePrime(64))
    const gBig = new BigInteger(g)
    const pBig = new BigInteger(p)
    
    const fakeKeyForAlice = gBig.pow(mitmPrivate.value, pBig.value)
    const fakeKeyForBob = gBig.pow(mitmPrivate.value, pBig.value)
    
    steps.push({
      type: 'intercept',
      description: '中间人拦截了 Alice 和 Bob 的公钥',
      interceptedAlicePublic: alicePublic,
      interceptedBobPublic: bobPublic
    })
    
    steps.push({
      type: 'fake-keys',
      description: '攻击者生成自己的公钥替换原始公钥',
      mitmPublicForAlice: fakeKeyForAlice.toString(),
      mitmPublicForBob: fakeKeyForBob.toString()
    })
    
    const aliceShared = this.deriveSharedSecret(mitmPrivate.toString(), alicePublic, p)
    const bobShared = this.deriveSharedSecret(mitmPrivate.toString(), bobPublic, p)
    
    steps.push({
      type: 'derived-keys',
      description: '攻击者可以分别与 Alice 和 Bob 建立共享密钥',
      mitmAliceShared: aliceShared,
      mitmBobShared: bobShared,
      aliceThinksKey: aliceShared,
      bobThinksKey: bobShared
    })
    
    steps.push({
      type: 'vulnerability',
      description: '漏洞原理：DH 协议不验证通信方身份，攻击者可以拦截并替换公钥'
    })
    
    return {
      attackerPrivateKey: mitmPrivate.toString(),
      attackerSharedWithAlice: aliceShared,
      attackerSharedWithBob: bobShared,
      aliceDerivedKey: aliceShared,
      bobDerivedKey: bobShared,
      steps
    }
  }

  paddingOracleSimulate(ciphertext, key, returnError = false) {
    const testData = ciphertext.slice(0, 32)
    
    if (returnError && Math.random() > 0.5) {
      return { valid: false, error: 'Padding error: invalid padding bytes detected' }
    }
    
    return { valid: true }
  }
}

export default new DHCrypto()
