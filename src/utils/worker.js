import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
const log = (...args) => postMessage({ type: 'log', payload: args.join(' ') });
const error = (...args) => postMessage({ type: 'error', payload: args.join(' ') });

const SCHEMA = `
  CREATE TABLE collections
  (
    name TEXT [ NOT NULL ],
  );

  CREATE TABLE collection_card
  (
    collection_name TEXT [ NOT NULL ],
    card_id TEXT [ NOT NULL ],

    CONSTRAINT fk_collection_name
      FOREIGN KEY (collection_name)
      REFERENCES collections (name)
  );
`;

const start = function (sqlite3) {
  log('Running SQLite3 version', sqlite3.version.libVersion);
  let db;
  if ('opfs' in sqlite3) {
    db = new sqlite3.oo1.OpfsDb('/mydb.sqlite3');
    log('OPFS is available, created persisted database at', db.filename);
  }
  else {
    log('OPFS is not available');
  }
  // Your SQLite code here.
  try {
    db.exec("drop table if exists collections; drop table if exists collection_card;")
    db.exec(SCHEMA);
  }
  catch (e) {
    log(e);
  }
};

log('Loading and initializing SQLite3 module...');
sqlite3InitModule({
  print: log,
  printErr: error,
}).then((sqlite3) => {
  log('Done initializing. Running demo...');
  try {
    start(sqlite3);
  }
  catch (err) {
    error(err.name, err.message);
  }
});


self.onmessage = function handleMessageFromMain(msg) {
  console.log("message from main received in worker:", msg);
}
