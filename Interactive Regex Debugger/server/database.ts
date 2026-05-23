import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import path from 'path'
import fs from 'fs'
import type { RegexSnippet, DebugHistory } from '../shared/types'

export class DatabaseManager {
  private static instance: DatabaseManager | null = null
  private db: Database | null = null
  private SQL: SqlJsStatic | null = null
  private dbPath: string

  private constructor() {
    this.dbPath = path.resolve(__dirname, '../data/regex-debugger.db')
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  async initialize(): Promise<void> {
    if (this.db) return

    this.SQL = await initSqlJs({
      locateFile: file => path.resolve(__dirname, `../node_modules/sql.js/dist/${file}`)
    })

    const dataDir = path.dirname(this.dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    if (fs.existsSync(this.dbPath)) {
      const data = fs.readFileSync(this.dbPath)
      this.db = new this.SQL.Database(data)
    } else {
      this.db = new this.SQL.Database()
      this.createTables()
      this.saveDatabase()
    }
  }

  private createTables(): void {
    if (!this.db) return

    this.db.run(`
      CREATE TABLE IF NOT EXISTS regex_snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        pattern TEXT NOT NULL,
        description TEXT,
        flags TEXT DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS debug_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL,
        test_string TEXT NOT NULL,
        flags TEXT DEFAULT '',
        result TEXT,
        created_at INTEGER NOT NULL
      )
    `)
  }

  private saveDatabase(): void {
    if (!this.db || !this.SQL) return

    const data = this.db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(this.dbPath, buffer)
  }

  async addSnippet(snippet: Omit<RegexSnippet, 'id' | 'createdAt' | 'updatedAt'>): Promise<RegexSnippet> {
    if (!this.db) throw new Error('Database not initialized')

    const now = Date.now()
    const result = this.db.run(
      'INSERT INTO regex_snippets (name, pattern, description, flags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [snippet.name, snippet.pattern, snippet.description || '', snippet.flags || '', now, now]
    )

    this.saveDatabase()

    return {
      id: result[0] as number,
      ...snippet,
      createdAt: now,
      updatedAt: now
    }
  }

  async getSnippets(): Promise<RegexSnippet[]> {
    if (!this.db) throw new Error('Database not initialized')

    const results = this.db.exec('SELECT * FROM regex_snippets ORDER BY updated_at DESC')
    if (results.length === 0) return []

    return results[0].values.map((row: any[]) => ({
      id: row[0],
      name: row[1],
      pattern: row[2],
      description: row[3] || '',
      flags: row[4] || '',
      createdAt: row[5],
      updatedAt: row[6]
    }))
  }

  async updateSnippet(id: number, updates: Partial<Omit<RegexSnippet, 'id' | 'createdAt'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const now = Date.now()
    const fields: string[] = []
    const values: any[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.pattern !== undefined) {
      fields.push('pattern = ?')
      values.push(updates.pattern)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.flags !== undefined) {
      fields.push('flags = ?')
      values.push(updates.flags)
    }

    fields.push('updated_at = ?')
    values.push(now, id)

    this.db.run(`UPDATE regex_snippets SET ${fields.join(', ')} WHERE id = ?`, values)
    this.saveDatabase()
  }

  async deleteSnippet(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    this.db.run('DELETE FROM regex_snippets WHERE id = ?', [id])
    this.saveDatabase()
  }

  async addHistory(history: Omit<DebugHistory, 'id' | 'createdAt'>): Promise<DebugHistory> {
    if (!this.db) throw new Error('Database not initialized')

    const now = Date.now()
    const result = this.db.run(
      'INSERT INTO debug_history (pattern, test_string, flags, result, created_at) VALUES (?, ?, ?, ?, ?)',
      [history.pattern, history.testString, history.flags || '', history.result || '', now]
    )

    this.saveDatabase()

    return {
      id: result[0] as number,
      ...history,
      createdAt: now
    }
  }

  async getHistory(limit: number = 50): Promise<DebugHistory[]> {
    if (!this.db) throw new Error('Database not initialized')

    const results = this.db.exec(
      'SELECT * FROM debug_history ORDER BY created_at DESC LIMIT ?',
      [limit]
    )

    if (results.length === 0) return []

    return results[0].values.map((row: any[]) => ({
      id: row[0],
      pattern: row[1],
      testString: row[2],
      flags: row[3] || '',
      result: row[4] || '',
      createdAt: row[5]
    }))
  }

  async clearHistory(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    this.db.run('DELETE FROM debug_history')
    this.saveDatabase()
  }
}
