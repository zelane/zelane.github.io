// Copyright 2023 Roy T. Hashimoto. All Rights Reserved.

import * as SQLite from 'wa-sqlite/src/sqlite-api.js';
import * as Comlink from 'comlink';

import { createTag } from "wa-sqlite/src/examples/tag.js";

// For a typical application, the Emscripten module would be imported
// statically, but we want to be able to select between the Asyncify
// and non-Asyncify builds so dynamic import is done later.
const WA_SQLITE = 'wa-sqlite/dist/wa-sqlite.mjs';
const WA_SQLITE_ASYNC = 'wa-sqlite/dist/wa-sqlite-async.mjs';

import moduleFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs'
// import { namespace } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js'

/**
 * @typedef Config
 * @property {string} [dbName] name of the SQLite database
 */

(async function () {
  /**
   * @param {Config} config
   * @returns {Promise<Function>}
   */
  async function open(config) {
    postMessage('ere');
    // Instantiate the SQLite API, choosing between Asyncify and non-Asyncify.
    const module = await moduleFactory();
    const sqlite3 = SQLite.Factory(module);
    const namespace = await import('wa-sqlite/src/examples/AccessHandlePoolVFS.js');

    // Create the VFS and register it as the default file system.
    const vfs = new namespace['AccessHandlePoolVFS'](...['demo-AccessHandlePoolVFS'] ?? []);
    await vfs.isReady;
    sqlite3.vfs_register(vfs, true);

    // Open the database;
    const db = await sqlite3.open_v2(config.dbName ?? 'demo');

    // Create the query interface.
    const tag = createTag(sqlite3, db);
    return Comlink.proxy(tag);
  }

  postMessage(null);
  Comlink.expose(open);
})();

