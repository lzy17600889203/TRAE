const SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]

const INV_SBOX = [
  0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
  0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
  0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
  0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
  0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
  0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
  0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
  0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
  0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
  0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
  0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
  0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
  0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
  0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
  0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
  0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
]

const MIX_COLUMNS_MATRIX = [
  [0x02, 0x03, 0x01, 0x01],
  [0x01, 0x02, 0x03, 0x01],
  [0x01, 0x01, 0x02, 0x03],
  [0x03, 0x01, 0x01, 0x02]
]

const INV_MIX_COLUMNS_MATRIX = [
  [0x0e, 0x0b, 0x0d, 0x09],
  [0x09, 0x0e, 0x0b, 0x0d],
  [0x0d, 0x09, 0x0e, 0x0b],
  [0x0b, 0x0d, 0x09, 0x0e]
]

const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]

export class AESCrypto {
  constructor() {
    this.state = null
    this.roundKeys = null
  }

  hexToBytes(hex) {
    const bytes = []
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16))
    }
    return bytes
  }

  bytesToHex(bytes) {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  keyExpansion(key) {
    const keyBytes = this.hexToBytes(key)
    const nk = keyBytes.length / 4
    const nr = nk + 6
    const nb = 4
    
    const expandedKey = [...keyBytes]
    
    for (let i = nk; i < nb * (nr + 1); i++) {
      let temp = [expandedKey[(i - 1) * 4], expandedKey[(i - 1) * 4 + 1], expandedKey[(i - 1) * 4 + 2], expandedKey[(i - 1) * 4 + 3]]
      
      if (i % nk === 0) {
        temp = this.rotWord(temp)
        temp = this.subWord(temp)
        temp[0] ^= RCON[(i / nk) - 1]
      } else if (nk > 6 && i % nk === 4) {
        temp = this.subWord(temp)
      }
      
      expandedKey.push(
        expandedKey[(i - nk) * 4] ^ temp[0],
        expandedKey[(i - nk) * 4 + 1] ^ temp[1],
        expandedKey[(i - nk) * 4 + 2] ^ temp[2],
        expandedKey[(i - nk) * 4 + 3] ^ temp[3]
      )
    }
    
    const roundKeys = []
    for (let r = 0; r <= nr; r++) {
      const roundKey = expandedKey.slice(r * 16, (r + 1) * 16)
      roundKeys.push({
        round: r,
        key: this.bytesToHex(roundKey),
        keyArray: roundKey
      })
    }
    
    return roundKeys
  }

  rotWord(word) {
    return [word[1], word[2], word[3], word[0]]
  }

  subWord(word) {
    return word.map(b => SBOX[b])
  }

  subBytes(state) {
    return state.map(row => row.map(b => SBOX[b]))
  }

  invSubBytes(state) {
    return state.map(row => row.map(b => INV_SBOX[b]))
  }

  shiftRows(state) {
    const result = [...state]
    for (let i = 1; i < 4; i++) {
      result[i] = [...state[(i + i) % 4].slice(i), ...state[(i + i) % 4].slice(0, i)]
    }
    return result
  }

  invShiftRows(state) {
    const result = [...state]
    for (let i = 1; i < 4; i++) {
      result[i] = [...state[(i + i) % 4].slice(4 - i), ...state[(i + i) % 4].slice(0, 4 - i)]
    }
    return result
  }

  mixColumns(state) {
    const result = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
    
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 4; k++) {
          result[r][c] ^= this.gmul(MIX_COLUMNS_MATRIX[r][k], state[k][c])
        }
      }
    }
    
    return result
  }

  invMixColumns(state) {
    const result = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
    
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 4; k++) {
          result[r][c] ^= this.gmul(INV_MIX_COLUMNS_MATRIX[r][k], state[k][c])
        }
      }
    }
    
    return result
  }

  gmul(a, b) {
    let p = 0
    for (let i = 0; i < 8; i++) {
      if (b & 1) {
        p ^= a
      }
      const hiBitSet = a & 0x80
      a = (a << 1) & 0xff
      if (hiBitSet) {
        a ^= 0x1b
      }
      b >>= 1
    }
    return p
  }

  addRoundKey(state, roundKey) {
    const keyBytes = this.hexToBytes(roundKey)
    const result = []
    for (let i = 0; i < 4; i++) {
      result.push([])
      for (let j = 0; j < 4; j++) {
        result[i].push(state[i][j] ^ keyBytes[i * 4 + j])
      }
    }
    return result
  }

  bytesToState(bytes) {
    const state = [[], [], [], []]
    for (let i = 0; i < 16; i++) {
      state[i % 4].push(bytes[i])
    }
    return state
  }

  stateToBytes(state) {
    const bytes = []
    for (let i = 0; i < 16; i++) {
      bytes.push(state[i % 4][Math.floor(i / 4)])
    }
    return bytes
  }

  padPKCS7(data) {
    const blockSize = 16
    const padding = blockSize - (data.length % blockSize)
    return [...data, ...new Array(padding).fill(padding)]
  }

  unpadPKCS7(data) {
    const padding = data[data.length - 1]
    if (padding < 1 || padding > 16) return data
    for (let i = data.length - padding; i < data.length; i++) {
      if (data[i] !== padding) return data
    }
    return data.slice(0, data.length - padding)
  }

  encrypt(plaintext, key, mode = 'ECB', iv = null, returnSteps = false) {
    const plaintextBytes = this.hexToBytes(plaintext)
    const paddedData = this.padPKCS7(plaintextBytes)
    const roundKeys = this.keyExpansion(key)
    const nr = roundKeys.length - 1
    
    const steps = []
    const blocks = []
    
    for (let blockIdx = 0; blockIdx < paddedData.length; blockIdx += 16) {
      const block = paddedData.slice(blockIdx, blockIdx + 16)
      let state = this.bytesToState(block)
      
      if (returnSteps) {
        steps.push({
          type: 'block-start',
          blockIndex: blockIdx / 16,
          state: this.bytesToHex(this.stateToBytes(state))
        })
      }
      
      state = this.addRoundKey(state, roundKeys[0].key)
      
      if (returnSteps) {
        steps.push({
          type: 'initial-round-key',
          round: 0,
          state: this.bytesToHex(this.stateToBytes(state)),
          roundKey: roundKeys[0].key
        })
      }
      
      for (let round = 1; round < nr; round++) {
        state = this.subBytes(state)
        
        if (returnSteps) {
          steps.push({
            type: 'sub-bytes',
            round,
            state: this.bytesToHex(this.stateToBytes(state))
          })
        }
        
        state = this.shiftRows(state)
        
        if (returnSteps) {
          steps.push({
            type: 'shift-rows',
            round,
            state: this.bytesToHex(this.stateToBytes(state))
          })
        }
        
        state = this.mixColumns(state)
        
        if (returnSteps) {
          steps.push({
            type: 'mix-columns',
            round,
            state: this.bytesToHex(this.stateToBytes(state))
          })
        }
        
        state = this.addRoundKey(state, roundKeys[round].key)
        
        if (returnSteps) {
          steps.push({
            type: 'add-round-key',
            round,
            state: this.bytesToHex(this.stateToBytes(state)),
            roundKey: roundKeys[round].key
          })
        }
      }
      
      state = this.subBytes(state)
      
      if (returnSteps) {
        steps.push({
          type: 'sub-bytes',
          round: nr,
          state: this.bytesToHex(this.stateToBytes(state))
        })
      }
      
      state = this.shiftRows(state)
      
      if (returnSteps) {
        steps.push({
          type: 'shift-rows',
          round: nr,
          state: this.bytesToHex(this.stateToBytes(state))
        })
      }
      
      state = this.addRoundKey(state, roundKeys[nr].key)
      
      if (returnSteps) {
        steps.push({
          type: 'final-round-key',
          round: nr,
          state: this.bytesToHex(this.stateToBytes(state)),
          roundKey: roundKeys[nr].key
        })
      }
      
      blocks.push(this.stateToBytes(state))
    }
    
    let ciphertext = this.bytesToHex(blocks.flat())
    
    if (mode === 'CBC' && iv) {
      ciphertext = this.encryptCBC(plaintext, key, iv, returnSteps)
    }
    
    return returnSteps ? { ciphertext, steps, keySchedule: roundKeys } : { ciphertext }
  }

  decrypt(ciphertext, key, mode = 'ECB', iv = null, returnSteps = false) {
    const ciphertextBytes = this.hexToBytes(ciphertext)
    const roundKeys = this.keyExpansion(key)
    const nr = roundKeys.length - 1
    
    const steps = []
    const blocks = []
    
    for (let blockIdx = 0; blockIdx < ciphertextBytes.length; blockIdx += 16) {
      const block = ciphertextBytes.slice(blockIdx, blockIdx + 16)
      let state = this.bytesToState(block)
      
      state = this.addRoundKey(state, roundKeys[nr].key)
      
      for (let round = nr - 1; round > 0; round--) {
        state = this.invShiftRows(state)
        state = this.invSubBytes(state)
        state = this.addRoundKey(state, roundKeys[round].key)
        state = this.invMixColumns(state)
      }
      
      state = this.invShiftRows(state)
      state = this.invSubBytes(state)
      state = this.addRoundKey(state, roundKeys[0].key)
      
      blocks.push(this.stateToBytes(state))
    }
    
    const paddedPlaintext = blocks.flat()
    const plaintextBytes = this.unpadPKCS7(paddedPlaintext)
    
    return {
      plaintext: this.bytesToHex(plaintextBytes),
      steps
    }
  }

  generateWeakKey(type = 'all-zeros') {
    const weakKeys = {
      'all-zeros': '00000000000000000000000000000000',
      'all-ones': 'ffffffffffffffffffffffffffffffff',
      'half-zeros': '0000000000000000ffffffffffffffff',
      ' repeating-byte': '01010101010101010101010101010101'
    }
    return weakKeys[type] || weakKeys['all-zeros']
  }
}

export default new AESCrypto()
