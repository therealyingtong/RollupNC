const mimcjs = require('../circomlib/src/mimc7.js');
const eddsa = require("../circomlib/src/eddsa.js");

function formatPrivKey(privKey) {
  return Buffer.from(privKey.toString().padStart(64, '0'), "hex");
}

class User {
  constructor(privKeyInt) {
    this.privKey = formatPrivKey(privKeyInt)
    this.pubkey = eddsa.prv2pub(this.privKey)
  }

  getAccount(index, balance, tokenType) {
    const nonce = 0;
    this.account = new Account(index, this.pubkey[0], this.pubkey[1], balance, nonce, tokenType)
    return this
  }

  signTx(transaction){
    const signature = transaction.sign(this.privKey)
    return signature
  }
}

class Account {
  constructor(_index, _PubkeyX, _PubkeyY, _balance, _nonce, _tokenType) {
    this.index = _index;
    this.pubkeyX = _PubkeyX;
    this.pubkeyY = _PubkeyY;
    this.balance = _balance;
    this.nonce = _nonce;
    this.tokenType = _tokenType;
  }

  leafHash() {
    const leafHash = mimcjs.multiHash([
      this.pubkeyX,
      this.pubkeyY,
      this.balance,
      this.nonce,
      this.tokenType
    ])
    return leafHash;
  }
}

module.exports = {
  User,
  Account,
}