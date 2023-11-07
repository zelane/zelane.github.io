import * as Comlink from './comlink.mjs';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';



const log = (...args) => console.log(...args);
const error = (...args) => console.error(...args);

log("Starting worker")

class SqliteWorker {
  db;
  rowMode = 'object';
  async init(dbFile, rowMode) {
    if (rowMode && rowMode !== 'array' && rowMode !== 'object') {
      throw new Error('Invalid rowMode');
    }
    this.rowMode = rowMode || this.rowMode;
    const sqlite3 = await sqlite3InitModule({ print: log, printErr: error });
    const vfs = await sqlite3.installOpfsSAHPoolVfs();
    this.db = new vfs.OpfsSAHPoolDb(dbFile, 'c');
    // this.db = new sqlite3.oo1.OpfsDb(dbFile, 'c');
  }

  executeSql(sqlStatement, bindParameters, callback) {
    return callback(
      this.db.exec({
        sql: sqlStatement,
        bind: bindParameters,
        returnValue: 'resultRows',
        rowMode: this.rowMode,
      }),
    );
  }
}

Comlink.expose(SqliteWorker);
