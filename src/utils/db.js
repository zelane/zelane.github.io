import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const log = (...args) => console.log(...args);
const error = (...args) => console.error(...args);

let db = null;

const start = function (sqlite3) {
  log('Running SQLite3 version', sqlite3.version.libVersion);
  db = new sqlite3.oo1.JsStorageDb('local');
  // if (db.storageSize()) {
  //   db.clearStorage(); // empty it!
  // }
  try {
    db.exec([
      `CREATE TABLE IF NOT EXISTS card (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        'set' TEXT NOT NULL,
        collector_number TEXT NOT NULL,
        data JSON
      );`,
      `CREATE TABLE IF NOT EXISTS collection (
        name TEXT PRIMARY KEY
      );`,
      `CREATE TABLE IF NOT EXISTS collection_card (
        card_id TEXT,
        collection_name TEXT,

        PRIMARY KEY (card_id, collection_name),
        FOREIGN KEY (collection_name) REFERENCES collection(name),
        FOREIGN KEY (card_id) REFERENCES card(id)
      );`,
      // "insert into cards values ('0000579f-7b35-4ed3-b44c-db2a538066fe', 'Fury Sliver', 'tsp', '157', '{}')"
    ]);
    console.log(db.selectObjects("select * from card"))
    console.log(db.selectObjects("select * from collection"))
  }
  finally {
    // db.close();
  }
};

export async function initDB() {
  log('Loading and initializing SQLite3 module...');
  try {
    const sqlite3 = await sqlite3InitModule({
      print: log,
      printErr: error,
    })
    log('Done initializing.');
    start(sqlite3);
    log("Done")
  }
  catch (err) {
    error(err.name, err.message);
  }
}

export function useDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }
  return db;
}