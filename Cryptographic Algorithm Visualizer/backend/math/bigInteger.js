class BigInteger {
  constructor(value = 0) {
    if (typeof value === 'string') {
      this.value = this._parseString(value)
    } else if (typeof value === 'number') {
      this.value = BigInt(value)
    } else if (value instanceof BigInteger) {
      this.value = value.value
    } else {
      this.value = BigInt(0)
    }
  }

  _parseString(str) {
    if (str.startsWith('0x')) {
      return BigInt('0x' + str.slice(2))
    }
    return BigInt(str)
  }

  add(other) {
    return new BigInteger(this.value + BigInt(other))
  }

  subtract(other) {
    return new BigInteger(this.value - BigInt(other))
  }

  multiply(other) {
    return new BigInteger(this.value * BigInt(other))
  }

  mod(modulus) {
    const m = BigInt(modulus)
    let result = ((this.value % m) + m) % m
    return new BigInteger(result)
  }

  pow(exponent, modulus = null) {
    const exp = BigInt(exponent)
    if (modulus === null) {
      return new BigInteger(this.value ** exp)
    }
    const m = BigInt(modulus)
    let base = ((this.value % m) + m) % m
    let result = 1n
    let expCopy = exp
    while (expCopy > 0n) {
      if (expCopy & 1n) {
        result = (result * base) % m
      }
      base = (base * base) % m
      expCopy >>= 1n
    }
    return new BigInteger(result)
  }

  equals(other) {
    return this.value === BigInt(other)
  }

  compareTo(other) {
    const a = this.value
    const b = BigInt(other)
    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  isZero() {
    return this.value === 0n
  }

  isOne() {
    return this.value === 1n
  }

  toString(radix = 10) {
    return this.value.toString(radix)
  }

  toHex() {
    return '0x' + this.value.toString(16)
  }

  bitLength() {
    return this.value.toString(2).length
  }

  gcd(other) {
    let a = this.value
    let b = BigInt(other)
    while (b !== 0n) {
      const temp = b
      b = a % b
      a = temp
    }
    return new BigInteger(a)
  }

  divide(other) {
    return new BigInteger(this.value / BigInt(other))
  }

  static random(max) {
    const randomBigInt = BigInt(Math.floor(Math.random() * Number(max)))
    return new BigInteger(randomBigInt)
  }

  modInverse(modulus) {
    const m = BigInt(modulus)
    let a = this.value
    let b = m
    let u1 = 1n, u2 = 0n
    
    while (!b.isZero?.() && b !== 0n) {
      const q = a / b
      const temp = b
      b = a % b
      a = temp
      const newU2 = u1 - q * u2
      u1 = u2
      u2 = newU2
    }
    
    if (a !== 1n) return null
    let result = ((u1 % m) + m) % m
    return new BigInteger(result)
  }
}

BigInteger.gcd = function(a, b) {
  const biA = new BigInteger(a)
  return biA.gcd(b)
}

BigInteger.modInverse = function(a, m) {
  const biA = new BigInteger(a)
  return biA.modInverse(m)
}

BigInteger.pow = function(base, exp) {
  return new BigInteger(base) ** BigInt(exp)
}

BigInteger.subtract = function(a, b) {
  return new BigInteger(a).subtract(b)
}

export default BigInteger
