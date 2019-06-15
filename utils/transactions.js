const eddsa = require('../circomlib/src/eddsa.js');
const mimcjs = require('../circomlib/src/mimc7.js');
const Account = require('./account');

class SwapTransaction {
  constructor(fromAccount, toAccount, amount, tokenType) {
    if (!(fromAccount instanceof Account.constructor)) {
      throw new Error(`fromAccount should be an instance of Account, got ${fromAccount}`)
    }
    if (!(toAccount instanceof Account.constructor)) {
      throw new Error(`toAccount should be an instance of Account, got ${toAccount}`)
    }
    this.fromX = fromAccount.pubkeyX;
    this.fromY = fromAccount.pubkeyY;

    this.toX = toAccount.pubkeyX;
    this.toY = toAccount.pubkeyY;
    this.amount = amount
    this.tokenType = tokenType;
  }
}

class Transaction {
  constructor(fromAccount, toAccount, nonce, amount, tokenType) {
    if (!(fromAccount instanceof Account.constructor)) {
      throw new Error(`fromAccount should be an instance of Account, got ${fromAccount}`)
    }
    if (!(toAccount instanceof Account.constructor)) {
      throw new Error(`toAccount should be an instance of Account, got ${toAccount}`)
    }
    this._fromAccount = fromAccount;
    this._toAccount = toAccount;

    this.fromX = fromAccount.pubkeyX;
    this.fromY = fromAccount.pubkeyY;

    this.toX = toAccount.pubkeyX;
    this.toY = toAccount.pubkeyY;

    this.nonce = nonce;
    this.amount = amount;
    this.tokenType = tokenType;

    this.hash = this.leafHash();

    this.swapTransaction = undefined;
    this.signature = undefined;

  }

  leafHash() {
    return mimcjs.multiHash([
      this.fromX,
      this.fromY,
      this.toX,
      this.toY,
      this.nonce,
      this.amount,
      this.tokenType,
    ]);
  }
  sign(privateKey) {
    this.signature = eddsa.signMiMC(privateKey, this.hash);
    this.R1 = this.signature.R8[0]
    this.R2 = this.signature.R8[1]
    this.S = this.signature.S
    return this.signature
  }
  fillSwapTx(transaction) {
    this.swapTransaction = new SwapTransaction(
      transaction._toAccount,
      transaction._fromAccount,
      transaction.amount,
      transaction.tokenType
    )
  }
}
module.exports = {
  SwapTransaction,
  Transaction,
}