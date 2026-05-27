const { getDB } = require('../db/database')

const productService = {
  getAllProducts: () => {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM products ORDER BY created_at DESC')
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()
    return rows
  },

  getProductById: (id) => {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?')
    stmt.bind([id])
    const row = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return row
  },

  createProduct: (data) => {
    const db = getDB()
    const { code, name, unit, min_stock, max_stock } = data
    try {
      const stmt = db.prepare(
        'INSERT INTO products (code, name, unit, min_stock, max_stock) VALUES (?, ?, ?, ?, ?)'
      )
      stmt.run([code, name, unit, min_stock, max_stock])
      stmt.free()
      const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id')
      lastIdStmt.step()
      const lastId = lastIdStmt.getAsObject().id
      lastIdStmt.free()
      return { id: lastId, code, name, unit, min_stock, max_stock }
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Product code already exists')
      }
      throw error
    }
  },

  updateProduct: (id, data) => {
    const db = getDB()
    const { code, name, unit, min_stock, max_stock } = data
    const stmt = db.prepare(
      'UPDATE products SET code = ?, name = ?, unit = ?, min_stock = ?, max_stock = ? WHERE id = ?'
    )
    stmt.run([code, name, unit, min_stock, max_stock, id])
    stmt.free()
    return { id: parseInt(id), code, name, unit, min_stock, max_stock }
  },

  deleteProduct: (id) => {
    const db = getDB()
    const stmt = db.prepare('DELETE FROM products WHERE id = ?')
    stmt.run([id])
    stmt.free()
    return true
  }
}

module.exports = productService