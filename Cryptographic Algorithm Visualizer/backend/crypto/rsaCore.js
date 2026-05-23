import { generatePrime, factorSmallNumber } from '../math/prime.js'

function modPow(base, exp, mod) {
  let result = 1n
  let b = base % mod
  let e = exp
  
  while (e > 0n) {
    if (e % 2n === 1n) {
      result = (result * b) % mod
    }
    b = (b * b) % mod
    e = e / 2n
  }
  
  return result
}

function extendedGCD(a, b) {
  if (b === 0n) return { gcd: a, x: 1n, y: 0n }
  
  const { gcd, x: x1, y: y1 } = extendedGCD(b, a % b)
  
  return {
    gcd,
    x: y1,
    y: x1 - (a / b) * y1
  }
}

function modInverse(a, m) {
  const { gcd, x } = extendedGCD(a, m)
  if (gcd !== 1n) return null
  return ((x % m) + m) % m
}

export class RSACrypto {
  constructor() {
    this.publicKey = null
    this.privateKey = null
  }

  generateKeyPair(bits = 1024, smallFactor = false) {
    const e = 65537n
    
    const p = BigInt(generatePrime(bits / 2, smallFactor))
    let q = BigInt(generatePrime(bits / 2, smallFactor))
    
    while (p === q) {
      q = BigInt(generatePrime(bits / 2, smallFactor))
    }
    
    const n = p * q
    const phi = (p - 1n) * (q - 1n)
    
    let d = modInverse(e, phi)
    if (!d) {
      d = modInverse(3n, phi)
      if (!d) d = 5n
    }
    
    this.publicKey = { n: n.toString(), e: e.toString() }
    this.privateKey = { n: n.toString(), d: d.toString(), p: p.toString(), q: q.toString() }
    
    return {
      publicKey: this.publicKey,
      privateKey: this.privateKey
    }
  }

  encrypt(message, publicKey) {
    const m = BigInt(message)
    const n = BigInt(publicKey.n)
    const e = BigInt(publicKey.e)
    
    const encrypted = modPow(m, e, n)
    
    return '0x' + encrypted.toString(16)
  }

  decrypt(ciphertext, privateKey) {
    const c = ciphertext.startsWith('0x') 
      ? BigInt(ciphertext) 
      : BigInt('0x' + ciphertext)
    const n = BigInt(privateKey.n)
    const d = BigInt(privateKey.d)
    
    const decrypted = modPow(c, d, n)
    
    return decrypted.toString()
  }

  factorModulus(n, returnSteps = false) {
    const nBig = BigInt(n)
    const steps = []
    
    if (nBig % 2n === 0n) {
      const result = nBig / 2n
      steps.push({ type: 'division', divisor: '2', result: result.toString() })
      return returnSteps ? { factors: ['2', result.toString()], steps } : ['2', result.toString()]
    }
    
    const smallDivisors = [3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n]
    
    for (const divisor of smallDivisors) {
      if (nBig % divisor === 0n) {
        const result = nBig / divisor
        steps.push({ type: 'division', divisor: divisor.toString(), result: result.toString() })
        return returnSteps ? { factors: [divisor.toString(), result.toString()], steps } : [divisor.toString(), result.toString()]
      }
      steps.push({ type: 'trial', divisor: divisor.toString(), result: 'not divisible' })
    }
    
    const factors = factorSmallNumber(n)
    if (factors.length > 0) {
      steps.push({ type: 'pollard', divisor: factors[0], result: factors[1] || '' })
      return returnSteps ? { factors, steps } : factors
    }
    
    return returnSteps ? { factors: [], steps } : []
  }

  derivePrivateKey(n, p, q, e) {
    const phi = (BigInt(p) - 1n) * (BigInt(q) - 1n)
    const result = modInverse(BigInt(e), phi)
    return result ? result.toString() : '0'
  }
}

export default new RSACrypto()
