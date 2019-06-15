const { User } = require('../utils/account');
const { Transaction } = require('../utils/transactions');
const { Tree } = require('../utils/trees');
const fs = require("fs");

const TX_DEPTH = 2
const BAL_DEPTH = 4

const Alice = (new User(privKeyInt = 5)).getAccount(index = 0, balance = 1000, tokenType = 10);
const Bob = (new User(privKeyInt = 5566)).getAccount(index = 1, balance = 1000, tokenType = 10);
const Charlie = (new User(privKeyInt = 7878)).getAccount(index = 2, balance = 1000, tokenType = 10);
const Daenerys = (new User(privKeyInt = 9000)).getAccount(index = 3, balance = 1000, tokenType = 10);


function createSwapTxPair(user1, user2) {
  const tx1 = new Transaction(user1.account, user2.account, 0, 50, 10)
  const tx2 = new Transaction(user2.account, user1.account, 0, 50, 10)
  tx1.fillSwapTx(tx2)
  tx2.fillSwapTx(tx1)
  user1.signTx(tx1)
  user2.signTx(tx2)
  return [tx1, tx2]
}

const [tx1, tx2] = createSwapTxPair(Alice, Bob);
const [tx3, tx4] = createSwapTxPair(Charlie, Daenerys);

const txArray = [tx1, tx2, tx3, tx4];
const balanceArray = [Alice.account, Bob.account, Charlie.account, Daenerys.account];

txTree = new Tree(txArray, TX_DEPTH)
balanceTree = new Tree(balanceArray, BAL_DEPTH)


function createSnarkInput(txTree, balanceTree) {

  function lookupBalanceField(senderOrReceiver, balanceField) {
    return txTree.items.map(tx =>
      balanceTree.items[tx[senderOrReceiver].index][balanceField]
    )
  }

  return {
    tx_root: txTree.root,
    paths2tx_root: txTree.everyMerkleProof(),
    paths2tx_root_pos: txTree.getMerklePosArray(),

    current_state: balanceTree.root,

    intermediate_roots: module.exports.stringifyArray(intermediateRoots.slice(0, 2 ** (tx_depth + 1))),
    paths2root_from: module.exports.stringifyArrayOfArrays(fromProofs),
    paths2root_to: module.exports.stringifyArrayOfArrays(newToProofs),
    paths2root_from_pos: fromPosArray,
    paths2root_to_pos: toPosArray,

    from_x: txTree.getItemFieldArray('fromX'),
    from_y: txTree.getItemFieldArray('fromY'),
    R8x: txTree.getItemFieldArray('R1'),
    R8y: txTree.getItemFieldArray('R2'),
    S: txTree.getItemFieldArray('S'),

    nonce_from: lookupBalanceField('_fromAccount', 'nonce'),
    to_x: txTree.getItemFieldArray('toX'),
    to_y: txTree.getItemFieldArray('toY'),
    nonce_to: lookupBalanceField('_toAccount', 'nonce'),
    amount: txTree.getItemFieldArray('amount'),

    token_balance_from: lookupBalanceField('_fromAccount', 'balance'),
    token_balance_to: lookupBalanceField('_toAccount', 'balance'),
    token_type_from: lookupBalanceField('_fromAccount', 'tokenType'),
    token_type_to: lookupBalanceField('_toAccount', 'tokenType'),
  }
}

const inputs = createSnarkInput(txTree, balanceTree);

fs.writeFileSync(
  "./input.json",
  JSON.stringify(inputs),
  "utf-8"
);