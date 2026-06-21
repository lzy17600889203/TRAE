import type { TraceRequest } from '../types/trace';

export function buildMockTrace(): TraceRequest {
  return {
    requestId: 'TRACE-8f3a-2c17-4e91-b0d8-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
    totalDuration: 2490,
    status: 'slow',
    nodes: [
      {
        id: 'gateway',
        name: 'API 网关',
        type: 'gateway',
        duration: 10,
        isBottleneck: false,
        slowSqls: [],
        stackTraces: [],
      },
      {
        id: 'order',
        name: '订单服务',
        type: 'service',
        duration: 50,
        isBottleneck: false,
        slowSqls: [],
        stackTraces: [
          {
            id: 'st-order-1',
            file: 'OrderController.java',
            line: 48,
            method: 'createOrder',
            class: 'com.shop.order.OrderController',
          },
          {
            id: 'st-order-2',
            file: 'OrderService.java',
            line: 112,
            method: 'processOrder',
            class: 'com.shop.order.OrderService',
          },
        ],
      },
      {
        id: 'inventory',
        name: '库存服务',
        type: 'service',
        duration: 2400,
        isBottleneck: true,
        slowSqls: [
          {
            id: 'sql-1',
            sql: `SELECT o.order_id, o.user_id, o.total_amount,
       oi.product_id, oi.quantity, p.name, p.price
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
INNER JOIN inventory inv ON p.id = inv.product_id
WHERE o.status IN ('pending', 'paid')
  AND inv.warehouse_id IN (1, 2, 3, 5, 7, 9)
  AND o.created_at BETWEEN '2024-01-01 00:00:00' AND NOW()
ORDER BY o.created_at DESC, o.total_amount DESC
LIMIT 50000;`,
            duration: 2150,
            rowsExamined: 482931,
            executedAt: '2024-06-21 14:32:17',
          },
          {
            id: 'sql-2',
            sql: `UPDATE inventory
SET stock_qty = stock_qty - 1,
    updated_at  = NOW(),
    version     = version + 1
WHERE product_id IN (
    SELECT product_id
    FROM order_items
    WHERE order_id = 'ORD20240621001'
) AND stock_qty > 0;`,
            duration: 220,
            rowsExamined: 1248,
            executedAt: '2024-06-21 14:32:19',
          },
          {
            id: 'sql-3',
            sql: `SELECT COUNT(*) AS total, SUM(stock_qty) AS stock_total,
       warehouse_id, category_id
FROM inventory
GROUP BY warehouse_id, category_id
WITH ROLLUP;`,
            duration: 85,
            rowsExamined: 8432,
            executedAt: '2024-06-21 14:32:19',
          },
        ],
        stackTraces: [
          {
            id: 'st-inv-1',
            file: 'InventoryService.java',
            line: 207,
            method: 'checkAvailability',
            class: 'com.shop.inventory.InventoryService',
          },
          {
            id: 'st-inv-2',
            file: 'InventoryRepository.java',
            line: 89,
            method: 'findByProductId',
            class: 'com.shop.inventory.InventoryRepository',
          },
          {
            id: 'st-inv-3',
            file: 'JdbcTemplate.java',
            line: 673,
            method: 'query',
            class: 'org.springframework.jdbc.core.JdbcTemplate',
          },
        ],
      },
      {
        id: 'db',
        name: 'MySQL 数据库',
        type: 'db',
        duration: 30,
        isBottleneck: false,
        slowSqls: [],
        stackTraces: [],
      },
    ],
    edges: [
      { source: 'gateway', target: 'order', duration: 10, isBottleneckPath: false },
      { source: 'order', target: 'inventory', duration: 50, isBottleneckPath: true },
      { source: 'inventory', target: 'db', duration: 2400, isBottleneckPath: true },
    ],
  };
}
