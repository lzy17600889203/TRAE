export function isProbablePrime(n, iterations = 20) {
  const bi = BigInt(n)
  
  if (bi <= 1n) return false
  if (bi === 2n || bi === 3n) return true
  
  const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]
  for (const p of smallPrimes) {
    if (bi === p) return true
    if (bi % p === 0n) return false
  }
  
  const nMinus1 = bi - 1n
  let d = nMinus1
  let s = 0
  
  while (d % 2n === 0n) {
    d /= 2n
    s++
  }
  
  for (let i = 0; i < iterations; i++) {
    const a = randomBigInt(bi - 4n) + 2n
    let x = modPow(a, d, bi)
    
    if (x === 1n || x === nMinus1) continue
    
    let isComposite = true
    for (let r = 0; r < s - 1; r++) {
      x = modPow(x, 2n, bi)
      if (x === nMinus1) {
        isComposite = false
        break
      }
    }
    
    if (isComposite) return false
  }
  
  return true
}

function randomBigInt(range) {
  const bits = range.toString(2).length
  const bytes = Math.ceil(bits / 8)
  let result = 0n
  
  for (let i = 0; i < bytes; i++) {
    result = (result << 8n) | BigInt(Math.floor(Math.random() * 256))
  }
  
  return result % (range + 1n)
}

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

export function generatePrime(bits = 256, smallFactor = false) {
  if (smallFactor) {
    const smallPrimes = [997n, 991n, 983n, 977n, 971n, 967n, 953n, 947n, 941n, 937n, 929n, 919n, 911n, 907n, 903n, 887n, 883n, 877n, 863n, 859n]
    const basePrime = smallPrimes[Math.floor(Math.random() * smallPrimes.length)]
    let candidate = basePrime
    let attempts = 0
    
    while (!isProbablePrime(candidate) && attempts < 100) {
      candidate += basePrime
      attempts++
    }
    
    return candidate.toString()
  }
  
  const min = 1n << BigInt(bits - 1)
  const max = (1n << BigInt(bits)) - 1n
  
  let attempts = 0
  while (attempts < 1000) {
    const random = randomBigInt(max - min)
    let candidate = min + random
    
    if (candidate % 2n === 0n) {
      candidate += 1n
    }
    
    if (isProbablePrime(candidate)) {
      return candidate.toString()
    }
    
    attempts++
  }
  
  return (997n * 991n).toString()
}

export function sieveOfEratosthenes(limit) {
  const isPrime = new Array(limit + 1).fill(true)
  isPrime[0] = isPrime[1] = false
  
  for (let p = 2; p * p <= limit; p++) {
    if (isPrime[p]) {
      for (let i = p * p; i <= limit; i += p) {
        isPrime[i] = false
      }
    }
  }
  
  return isPrime.map((v, i) => v ? i : null).filter(v => v !== null)
}

export function trialDivision(n) {
  const factors = []
  let num = BigInt(n)
  let divisor = 2n
  
  while (divisor * divisor <= num) {
    while (num % divisor === 0n) {
      factors.push(divisor.toString())
      num /= divisor
    }
    divisor++
  }
  
  if (num > 1n) {
    factors.push(num.toString())
  }
  
  return factors
}

export function factorSmallNumber(n) {
  const factors = []
  let num = BigInt(n)
  
  while (num % 2n === 0n) {
    factors.push('2')
    num /= 2n
  }
  
  let divisor = 3n
  while (divisor * divisor <= num) {
    while (num % divisor === 0n) {
      factors.push(divisor.toString())
      num /= divisor
    }
    divisor += 2n
  }
  
  if (num > 1n) {
    factors.push(num.toString())
  }
  
  return factors
}
