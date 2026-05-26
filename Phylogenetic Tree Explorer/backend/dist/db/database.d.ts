import { Database } from 'sql.js';
export interface Species {
    id: number;
    name: string;
    latin_name: string;
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
    parent_id: number | null;
    created_at: string;
}
export interface Feature {
    id: number;
    species_id: number;
    feature_name: string;
    feature_value: string;
    category: string;
}
export interface CharacteristicMatrix {
    species_id: number;
    feature_name: string;
    feature_value: number;
}
declare function queryAll(sql: string, params?: any[]): any[];
declare function run(sql: string, params?: any[]): {
    lastInsertRowid: number;
    changes: number;
};
declare function get(sql: string, params?: any[]): any | null;
declare function exec(sql: string): void;
declare function transaction(fn: () => void): void;
export declare function initDatabase(): Promise<Database>;
export declare function saveDatabase(): void;
export declare function getDb(): Database;
export declare function createSchema(): void;
export declare function clearAllData(): void;
export { queryAll, run, get as dbGet, exec as dbExec, transaction as dbTransaction };
//# sourceMappingURL=database.d.ts.map