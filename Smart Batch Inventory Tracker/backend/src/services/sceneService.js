const { getDB } = require('../db/database')
const productService = require('./productService')
const inventoryService = require('./inventoryService')

const scenes = [
  {
    id: 'normal',
    name: '常规出入库场景',
    description: '标准的入库和出库操作流程'
  },
  {
    id: 'multi-batch',
    name: '多批次混合扣减场景',
    description: '同时存在多个批次，出库时自动按FIFO扣减'
  },
  {
    id: 'low-stock',
    name: '库存不足预警场景',
    description: '库存低于安全库存时触发预警'
  },
  {
    id: 'expired',
    name: '过期批次锁定场景',
    description: '存在过期批次，优先扣减有效批次'
  }
]

const sceneService = {
  getScenes: () => scenes,

  loadScene: (sceneId) => {
    sceneService.resetDatabase()

    switch (sceneId) {
      case 'normal':
        return sceneService.loadNormalScene()
      case 'multi-batch':
        return sceneService.loadMultiBatchScene()
      case 'low-stock':
        return sceneService.loadLowStockScene()
      case 'expired':
        return sceneService.loadExpiredScene()
      default:
        throw new Error('Scene not found')
    }
  },

  resetDatabase: () => {
    const db = getDB()
    db.run('DELETE FROM inventory_transactions')
    db.run('DELETE FROM inventory_snapshot')
    db.run('DELETE FROM batches')
    db.run('DELETE FROM products')
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('products', 'batches', 'inventory_transactions', 'inventory_snapshot')")
  },

  loadNormalScene: () => {
    const product = productService.createProduct({ code: 'P001', name: '普通商品A', unit: '件', min_stock: 10, max_stock: 100 })
    
    inventoryService.stockIn({ product_id: product.id, batch_no: 'B20240101', quantity: 50, cost: 10.00, remark: '初始入库' })
    inventoryService.stockIn({ product_id: product.id, batch_no: 'B20240102', quantity: 30, cost: 12.00, remark: '第二批入库' })
    inventoryService.stockOut({ product_id: product.id, quantity: 25, remark: '客户订单' })

    return { message: '常规出入库场景已加载', product }
  },

  loadMultiBatchScene: () => {
    const product = productService.createProduct({ code: 'P002', name: '多批次商品B', unit: '箱', min_stock: 20, max_stock: 200 })
    
    inventoryService.stockIn({ product_id: product.id, batch_no: 'B20240301', quantity: 40, cost: 50.00, remark: '第一批' })
    inventoryService.stockIn({ product_id: product.id, batch_no: 'B20240302', quantity: 35, cost: 52.00, remark: '第二批' })
    inventoryService.stockIn({ product_id: product.id, batch_no: 'B20240303', quantity: 25, cost: 48.00, remark: '第三批' })
    inventoryService.stockOut({ product_id: product.id, quantity: 60, remark: '大额订单' })

    return { message: '多批次混合扣减场景已加载', product }
  },

  loadLowStockScene: () => {
    const product = productService.createProduct({ code: 'P003', name: '低库存商品C', unit: '个', min_stock: 15, max_stock: 80 })
    
    inventoryService.stockIn({ product_id: product.id, batch_no: 'B20240201', quantity: 20, cost: 8.00, remark: '初始库存' })
    inventoryService.stockOut({ product_id: product.id, quantity: 12, remark: '销售出库' })

    return { message: '库存不足预警场景已加载', product }
  },

  loadExpiredScene: () => {
    const product = productService.createProduct({ code: 'P004', name: '临期商品D', unit: '瓶', min_stock: 10, max_stock: 100 })
    
    const expiredDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const validDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    inventoryService.stockIn({ product_id: product.id, batch_no: 'B20231201', quantity: 30, cost: 15.00, expiry_date: expiredDate, remark: '已过期批次' })
    inventoryService.stockIn({ product_id: product.id, batch_no: 'B20240101', quantity: 25, cost: 16.00, expiry_date: validDate, remark: '有效批次' })
    inventoryService.stockOut({ product_id: product.id, quantity: 20, remark: '正常出库' })

    return { message: '过期批次锁定场景已加载', product }
  }
}

module.exports = sceneService