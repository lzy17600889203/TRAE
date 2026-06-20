export const AREAS = [
  { id: 'A', name: 'A区', color: '#67e8a8', row: 0, col: 0 },
  { id: 'B', name: 'B区', color: '#7ad9ff', row: 0, col: 1 },
  { id: 'C', name: 'C区', color: '#b58bff', row: 1, col: 0 },
  { id: 'D', name: 'D区', color: '#ffc94a', row: 1, col: 1 }
]

const STATUS_POOL = ['free', 'used', 'used', 'used', 'used', 'used', 'reserved', 'free', 'free', 'used']

const PLATES = [
  '京A·12345', '京B·88K23', '沪C·Q6A99', '粤D·520YY', '川A·7P3Q1',
  '浙B·LZ001', '苏E·666NB', '鲁F·A7L89', '津G·88123', '鄂H·2A3B4',
  '冀J·555PK', '豫K·R2D23', '陕A·8J9Q3', '闽D·77ABC', '赣L·3M9N1'
]

function randTime () {
  const h = 8 + Math.floor(Math.random() * 8)
  const m = Math.floor(Math.random() * 60).toString().padStart(2, '0')
  return `${h.toString().padStart(2, '0')}:${m}`
}

function pickPlate (used) {
  let plate
  let guard = 0
  do {
    plate = PLATES[Math.floor(Math.random() * PLATES.length)] + '-' + Math.floor(Math.random() * 90 + 10)
    guard++
  } while (used.has(plate) && guard < 20)
  used.add(plate)
  return plate
}

export function generateParking (rowsPerArea = 3, colsPerArea = 6) {
  const spots = []
  const usedPlates = new Set()
  AREAS.forEach(area => {
    for (let r = 0; r < rowsPerArea; r++) {
      for (let c = 0; c < colsPerArea; c++) {
        const status = STATUS_POOL[Math.floor(Math.random() * STATUS_POOL.length)]
        const id = `${area.id}-${r + 1}-${c + 1}`
        spots.push({
          id,
          area: area.id,
          row: r,
          col: c,
          status,
          plate: status !== 'free' ? pickPlate(usedPlates) : '',
          inTime: status !== 'free' ? randTime() : ''
        })
      }
    }
  })
  return spots
}
