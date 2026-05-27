const { getDB } = require('../db/database')

const batchService = {
  getBatches: (product_id = null) => {
    const db = getDB()
    let query = 'SELECT * FROM batches WHERE archived = 0'
    const params = []
    if (product_id) {
      query += ' AND product_id = ?'
      params.push(product_id)
    }
    query += ' ORDER BY created_at ASC'
    
    const stmt = db.prepare(query)
    stmt.bind(params)
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()
    return rows
  },

  getBatchById: (id) => {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM batches WHERE id = ? AND archived = 0')
    stmt.bind([id])
    const row = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return row
  },

  createBatch: (data) => {
    const db = getDB()
    const { product_id, batch_no, quantity, cost, expiry_date } = data
    const stmt = db.prepare(
      'INSERT INTO batches (product_id, batch_no, quantity, cost, expiry_date) VALUES (?, ?, ?, ?, ?)'
    )
    stmt.run([product_id, batch_no, quantity, cost, expiry_date || null])
    stmt.free()
    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id')
    lastIdStmt.step()
    const lastId = lastIdStmt.getAsObject().id
    lastIdStmt.free()
    return { id: lastId, product_id, batch_no, quantity, cost, expiry_date }
  },

  updateBatchQuantity: (id, quantity) => {
    const db = getDB()
    const stmt = db.prepare('UPDATE batches SET quantity = ? WHERE id = ?')
    stmt.run([quantity, id])
    stmt.free()
    return true
  },

  archiveBatch: (id) => {
    const db = getDB()
    const stmt = db.prepare('UPDATE batches SET archived = 1 WHERE id = ?')
    stmt.run([id])
    stmt.free()
    return true
  },

  deleteBatch: (id) => {
    const db = getDB()
    const stmt = db.prepare('DELETE FROM batches WHERE id = ?')
    stmt.run([id])
    stmt.free()
    return true
  }
}

module.exports = batchService