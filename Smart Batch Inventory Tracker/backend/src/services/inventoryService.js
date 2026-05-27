const { getDB } = require('../db/database')
const batchService = require('./batchService')

const inventoryService = {
  getInventorySnapshot: () => {
    const db = getDB()
    const stmt = db.prepare(`
      SELECT s.*, p.code, p.name, p.unit, p.min_stock
      FROM inventory_snapshot s
      LEFT JOIN products p ON s.product_id = p.id
      ORDER BY p.name
    `)
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()
    return rows
  },

  getProductSnapshot: (product_id) => {
    const db = getDB()
    const stmt = db.prepare(`
      SELECT s.*, p.code, p.name, p.unit, p.min_stock
      FROM inventory_snapshot s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE s.product_id = ?
    `)
    stmt.bind([product_id])
    const row = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return row
  },

  stockIn: ({ product_id, batch_no, quantity, cost, expiry_date, remark }) => {
    const batch = batchService.createBatch({ product_id, batch_no, quantity, cost, expiry_date })
    
    const db = getDB()
    const stmt = db.prepare(`
      INSERT INTO inventory_transactions 
      (product_id, batch_id, type, quantity, unit_cost, total_cost, remark)
      VALUES (?, ?, 'IN', ?, ?, ?, ?)
    `)
    stmt.run([product_id, batch.id, quantity, cost, quantity * cost, remark || null])
    stmt.free()

    inventoryService.updateSnapshot(product_id)
    return { success: true, message: 'Stock in successfully' }
  },

  stockOut: ({ product_id, quantity, remark }) => {
    const batches = batchService.getBatches(product_id)
    let remaining = quantity
    const transactions = []
    const now = new Date().toISOString()

    const expiredBatches = batches.filter(b => b.expiry_date && new Date(b.expiry_date) < new Date())
    const validBatches = batches.filter(b => !b.expiry_date || new Date(b.expiry_date) >= new Date())

    const db = getDB()

    for (const batch of validBatches) {
      if (remaining <= 0) break
      
      const deduct = Math.min(batch.quantity, remaining)
      const newQuantity = batch.quantity - deduct
      
      if (newQuantity === 0) {
        batchService.archiveBatch(batch.id)
      } else {
        batchService.updateBatchQuantity(batch.id, newQuantity)
      }

      const stmt = db.prepare(`
        INSERT INTO inventory_transactions 
        (product_id, batch_id, type, quantity, unit_cost, total_cost, transaction_date, remark)
        VALUES (?, ?, 'OUT', ?, ?, ?, ?, ?)
      `)
      stmt.run([product_id, batch.id, deduct, batch.cost, deduct * batch.cost, now, remark || null])
      stmt.free()
      
      transactions.push({ batch_id: batch.id, batch_no: batch.batch_no, quantity: deduct })
      remaining -= deduct
    }

    if (remaining > 0) {
      for (const batch of expiredBatches) {
        if (remaining <= 0) break
        
        const deduct = Math.min(batch.quantity, remaining)
        const newQuantity = batch.quantity - deduct
        
        if (newQuantity === 0) {
          batchService.archiveBatch(batch.id)
        } else {
          batchService.updateBatchQuantity(batch.id, newQuantity)
        }

        const stmt = db.prepare(`
          INSERT INTO inventory_transactions 
          (product_id, batch_id, type, quantity, unit_cost, total_cost, transaction_date, remark)
          VALUES (?, ?, 'OUT', ?, ?, ?, ?, ?)
        `)
        const expiredRemark = remark ? remark + ' (expired)' : '(expired)'
        stmt.run([product_id, batch.id, deduct, batch.cost, deduct * batch.cost, now, expiredRemark])
        stmt.free()
        
        transactions.push({ batch_id: batch.id, batch_no: batch.batch_no, quantity: deduct, expired: true })
        remaining -= deduct
      }
    }

    inventoryService.updateSnapshot(product_id)

    return { 
      success: true, 
      message: 'Stock out successfully',
      remaining: remaining < 0 ? Math.abs(remaining) : 0,
      transactions 
    }
  },

  updateSnapshot: (product_id) => {
    const batches = batchService.getBatches(product_id)
    const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0)
    const db = getDB()
    
    if (totalQuantity === 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO inventory_snapshot (product_id, total_quantity, avg_cost, updated_at)
        VALUES (?, 0, 0, ?)
      `)
      stmt.run([product_id, new Date().toISOString()])
      stmt.free()
      return
    }

    const totalCost = batches.reduce((sum, b) => sum + b.quantity * b.cost, 0)
    const avgCost = totalCost / totalQuantity

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO inventory_snapshot (product_id, total_quantity, avg_cost, updated_at)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run([product_id, totalQuantity, avgCost, new Date().toISOString()])
    stmt.free()
  },

  getTransactions: (product_id = null, limit = 100) => {
    const db = getDB()
    let query = `
      SELECT t.*, b.batch_no, p.code, p.name
      FROM inventory_transactions t
      LEFT JOIN batches b ON t.batch_id = b.id
      LEFT JOIN products p ON t.product_id = p.id
    `
    const params = []
    
    if (product_id) {
      query += ' WHERE t.product_id = ?'
      params.push(product_id)
    }
    
    query += ' ORDER BY t.transaction_date DESC LIMIT ?'
    params.push(limit)
    
    const stmt = db.prepare(query)
    stmt.bind(params)
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()
    return rows
  },

  exportReport: () => {
    const db = getDB()
    
    const productStmt = db.prepare('SELECT * FROM products')
    const products = []
    while (productStmt.step()) {
      products.push(productStmt.getAsObject())
    }
    productStmt.free()

    const batchStmt = db.prepare('SELECT * FROM batches')
    const batches = []
    while (batchStmt.step()) {
      batches.push(batchStmt.getAsObject())
    }
    batchStmt.free()

    const transStmt = db.prepare('SELECT * FROM inventory_transactions ORDER BY transaction_date DESC')
    const transactions = []
    while (transStmt.step()) {
      transactions.push(transStmt.getAsObject())
    }
    transStmt.free()

    const snapStmt = db.prepare(`
      SELECT s.*, p.code, p.name, p.unit 
      FROM inventory_snapshot s
      LEFT JOIN products p ON s.product_id = p.id
    `)
    const snapshots = []
    while (snapStmt.step()) {
      snapshots.push(snapStmt.getAsObject())
    }
    snapStmt.free()

    return {
      export_time: new Date().toISOString(),
      products,
      batches,
      transactions,
      snapshots
    }
  }
}

module.exports = inventoryService