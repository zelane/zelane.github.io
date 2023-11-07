// Copyright 2023 Roy T. Hashimoto. All Rights Reserved.

import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs';
import * as SQLite from 'wa-sqlite/src/sqlite-api.js';
import { AccessHandlePoolVFS } from 'wa-sqlite/src/examples/AccessHandlePoolVFS.js';

import { createSharedServicePort } from './SharedService.js';

import { createTag } from "wa-sqlite/src/examples/tag.js";

const sqlite3Ready = SQLiteESMFactory().then(module => {
  return SQLite.Factory(module);
});

class DatabaseService {
  #chain;
  #isTransactionPending;
  #tag;

  constructor() {
    this.#chain = this.#initialize();
  }

  query(...args) {
    const result = this.#chain.then(async () => {
      if (this.#isTransactionPending()) {
        await this.#tag('ROLLBACK').catch(() => { });
      }
      return this.#tag(...args);
    });
    this.#chain = result.catch(() => { });
    return result;
  }

  async #initialize() {
    // Create the database.
    const sqlite3 = await sqlite3Ready;
    const vfs = new AccessHandlePoolVFS('/demo-AccessHandlePoolVFS');
    await vfs.isReady;
    sqlite3.vfs_register(vfs, true);
    const db = await sqlite3.open_v2('demo');

    // Create the query interface.
    this.#tag = createTag(sqlite3, db);
    this.#isTransactionPending = () => !sqlite3.get_autocommit(db);

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
