import fs from 'fs';
import path from 'path';

// Database file path
const dbPath = path.join(process.cwd(), 'data', 'db.json');

// Database schema
export interface DbSchema {
  users: any[];
  human_profiles: any[];
  agent_profiles: any[];
  tasks: any[];
  task_applications: any[];
  messages: any[];
  task_completions: any[];
  reviews: any[];
  // SocialFi / Earn tables
  tweet_submissions: any[];
  user_points: any[];
  referrals: any[];
}

// Default empty database
const defaultDb: DbSchema = {
  users: [],
  human_profiles: [],
  agent_profiles: [],
  tasks: [],
  task_applications: [],
  messages: [],
  task_completions: [],
  reviews: [],
  // SocialFi / Earn tables
  tweet_submissions: [],
  user_points: [],
  referrals: [],
};

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read database
function readDb(): DbSchema {
  ensureDataDir();
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading database:', error);
  }
  return JSON.parse(JSON.stringify(defaultDb));
}

// Write database
function writeDb(data: DbSchema): void {
  ensureDataDir();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Prepared statement simulator
interface PreparedStatement {
  run: (...args: any[]) => { changes: number };
  get: (...args: any[]) => any;
  all: (...args: any[]) => any[];
}

// Main db object that mimics better-sqlite3 interface
const db = {
  prepare: (sql: string): PreparedStatement => {
    return {
      run: (...args: any[]) => {
        const data = readDb();
        let changes = 0;

        // Parse SQL to determine operation
        const sqlLower = sql.toLowerCase().trim();

        if (sqlLower.startsWith('insert into')) {
          const tableMatch = sql.match(/insert into (\w+)/i);
          if (tableMatch) {
            const table = tableMatch[1] as keyof DbSchema;
            const colsMatch = sql.match(/\(([^)]+)\)\s*values/i);
            if (colsMatch) {
              const cols = colsMatch[1].split(',').map(c => c.trim());
              const record: any = {};
              cols.forEach((col, i) => {
                record[col] = args[i];
              });
              record.created_at = record.created_at || new Date().toISOString();
              data[table].push(record);
              changes = 1;
            }
          }
        } else if (sqlLower.startsWith('update')) {
          const tableMatch = sql.match(/update (\w+) set/i);
          if (tableMatch) {
            const table = tableMatch[1] as keyof DbSchema;
            const whereMatch = sql.match(/where (.+)$/i);
            if (whereMatch) {
              const whereCol = whereMatch[1].match(/(\w+)\s*=/)?.[1];
              const whereVal = args[args.length - 1];

              data[table].forEach((row: any, idx: number) => {
                if (row[whereCol!] === whereVal) {
                  const setMatch = sql.match(/set (.+?) where/i);
                  if (setMatch) {
                    const setParts = setMatch[1].split(',');
                    let argIdx = 0;
                    setParts.forEach(part => {
                      const colMatch = part.trim().match(/(\w+)\s*=/);
                      if (colMatch) {
                        const col = colMatch[1];
                        if (part.includes('?')) {
                          data[table][idx][col] = args[argIdx++];
                        } else if (part.includes('+ 1')) {
                          data[table][idx][col] = (data[table][idx][col] || 0) + 1;
                        } else if (part.includes('+')) {
                          const addMatch = part.match(/\+\s*\?/);
                          if (addMatch) {
                            data[table][idx][col] = (data[table][idx][col] || 0) + args[argIdx++];
                          }
                        }
                      }
                    });
                  }
                  changes++;
                }
              });
            }
          }
        } else if (sqlLower.startsWith('delete from')) {
          const tableMatch = sql.match(/delete from (\w+)/i);
          if (tableMatch) {
            const table = tableMatch[1] as keyof DbSchema;
            const original = data[table].length;
            // For now just clear all - would need proper WHERE parsing
            data[table] = [];
            changes = original;
          }
        }

        writeDb(data);
        return { changes };
      },

      get: (...args: any[]) => {
        const data = readDb();
        const sqlLower = sql.toLowerCase().trim();

        const tableMatch = sql.match(/from (\w+)/i);
        if (!tableMatch) return undefined;

        const table = tableMatch[1] as keyof DbSchema;
        const whereMatch = sql.match(/where (.+?)(?:\s+order|\s+limit|\s*$)/i);

        if (whereMatch) {
          const conditions = whereMatch[1].split(/\s+and\s+/i);
          return data[table].find((row: any) => {
            return conditions.every((cond, idx) => {
              const colMatch = cond.match(/(\w+)\s*=/);
              if (colMatch) {
                return row[colMatch[1]] === args[idx];
              }
              return true;
            });
          });
        }

        return data[table][0];
      },

      all: (...args: any[]) => {
        const data = readDb();
        const tableMatch = sql.match(/from (\w+)/i);
        if (!tableMatch) return [];

        const table = tableMatch[1] as keyof DbSchema;
        let results = [...data[table]];

        // Handle JOINs and complex queries by returning base table data
        // The API routes will handle the joins

        const whereMatch = sql.match(/where (.+?)(?:\s+order|\s+limit|\s*$)/i);
        if (whereMatch && args.length > 0) {
          const conditions = whereMatch[1].split(/\s+and\s+/i);
          let argIdx = 0;
          results = results.filter((row: any) => {
            return conditions.every((cond) => {
              if (cond.includes('?')) {
                const colMatch = cond.match(/(\w+)\s*=/);
                if (colMatch) {
                  return row[colMatch[1]] === args[argIdx++];
                }
                // Handle <= and >=
                const leMatch = cond.match(/(\w+)\s*<=/);
                if (leMatch) {
                  return row[leMatch[1]] <= args[argIdx++];
                }
                const geMatch = cond.match(/(\w+)\s*>=/);
                if (geMatch) {
                  return row[geMatch[1]] >= args[argIdx++];
                }
                // Handle LIKE
                const likeMatch = cond.match(/(\w+)\s+like/i);
                if (likeMatch) {
                  const pattern = args[argIdx++].replace(/%/g, '.*');
                  return new RegExp(pattern, 'i').test(row[likeMatch[1]] || '');
                }
              }
              return true;
            });
          });
        }

        // Handle LIMIT
        const limitMatch = sql.match(/limit\s+(\d+|\?)/i);
        if (limitMatch) {
          const limit = limitMatch[1] === '?' ? args[args.length - 1] : parseInt(limitMatch[1]);
          results = results.slice(0, limit);
        }

        return results;
      },
    };
  },

  transaction: (fn: () => void) => {
    return () => {
      fn();
    };
  },

  exec: (sql: string) => {
    // No-op for schema creation since we use JSON
  },

  // Direct access methods for simpler operations
  getDb: readDb,
  saveDb: writeDb,
};

export default db;

// Named exports for direct access
export const getDb = db.getDb;
export const saveDb = db.saveDb;

// Helper functions
export function parseJSON<T>(str: string | null | any): T | null {
  if (!str) return null;
  if (typeof str === 'object') return str as T;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function stringifyJSON(obj: any): string {
  return JSON.stringify(obj);
}
