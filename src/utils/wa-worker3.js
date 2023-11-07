// Copyright 2023 Roy T. Hashimoto. All Rights Reserved.

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

import { createSharedServicePort } from './SharedService.js';


const log = (...args) => console.log(...args);
const error = (...args) => console.error(...args);

class DatabaseService {
  #chain;
  #isTransactionPending;
  #db;

  constructor() {
    this.#chain = this.#initialize();
  }

  executeSql(sqlStatement, bindParameters) {
    return this.#db.exec({
      sql: sqlStatement,
      bind: bindParameters,
      returnValue: 'resultRows',
      rowMode: 'object',
    });
  }

  query(...args) {
    const result = this.#chain.then(async () => {
      if (this.#isTransactionPending()) {
        await this.executeSql('ROLLBACK').catch(() => { });
      }
      return this.executeSql(...args);
    });
    this.#chain = result.catch(() => { });
    return result;
  }

  async #initialize() {
    const sqlite3 = await sqlite3InitModule({ print: log, printErr: error });
    const vfs = await sqlite3.installOpfsSAHPoolVfs();
    await vfs.isReady;
    console.log("here")
    this.#db = new vfs.OpfsSAHPoolDb('testvfs', 'c');
    // this.#isTransactionPending = () => !sqlite3.get_autocommit(this.#db);
    this.#isTransactionPending = () => false;

    this.query(`
      PRAGMA locking_mode=exclusive;
      PRAGMA journal_mode=truncate;
    `);
  }
}

addEventListener('message', () => {
  const databaseService = new DatabaseService();
  const providerPort = createSharedServicePort(databaseService)
  postMessage(null, [providerPort]);
});

addEventListener("install", event => {
  console.log("Service worker installed");
});
addEventListener("activate", event => {
  console.log("Service worker activated");
});
addEventListener("fetch", event => {
  console.log(event.request);
});