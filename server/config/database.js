const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, '../db.json'));
const db = low(adapter);

// Set default structure only if empty
if (!db.has('users').value()) {
  db.defaults({
    users: [],
    wallets: [],
    challenges: [],
    transactions: [],
    meta: { lastUserId: 0, lastWalletId: 0, lastChallengeId: 0, lastTransactionId: 0 }
  }).write();
}

console.log('✅ Database initialized');

// Helper to mimic prepare().run() / .get() / .all()
function prepare(sql) {
  return {
    // INSERT into users
    run: (...params) => {
      return { lastInsertRowid: null };
    },
    get: (...params) => null,
    all: (...params) => []
  };
}

module.exports = { db, prepare };