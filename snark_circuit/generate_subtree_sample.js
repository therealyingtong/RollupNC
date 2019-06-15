const snarkjs = require("snarkjs");
const fs = require("fs");
const account = require("../utils/generate_accounts.js");
const balanceLeaf = require("../utils/generate_balance_leaf.js");
const txLeaf = require("../utils/generate_tx_leaf.js");
const merkle = require("../utils/MiMCMerkle.js")
const update = require("../utils/update.js")

const TX_DEPTH = 1; //2**1 transactions
const BAL_SUB_DEPTH = 2; //2**2 accounts per subtree
const BAL_DEPTH = 6; //2**6 subtrees

// generate zero, Alice (0), Bob (1), Charlie (2), Daenerys (3) accounts with the following parameters
const num_accts = 4;
const prvKeys = account.generatePrvKeys(num_accts);
const pubKeys = account.generatePubKeys(prvKeys);
const token_types = [1, 1, 1, 1];
const balances = [1000, 20, 200, 100];
const nonces = [0, 0, 0, 0];

// generate balance leaves for user accounts
const balanceLeafArray = balanceLeaf.generateBalanceLeafArray(
    account.getPubKeysX(pubKeys),
    account.getPubKeysY(pubKeys),
    token_types, balances, nonces
)

// generate tx's: 
// 1. Alice --500--> Charlie , 
// 2. Daenerys --50--> Bob 

from_accounts_idx = [0, 3]
from_accounts = update.pickByIndices(pubKeys, from_accounts_idx)

to_accounts_idx = [2, 1]
to_accounts = update.pickByIndices(pubKeys, to_accounts_idx)

from_x = account.getPubKeysX(from_accounts)
from_y = account.getPubKeysY(from_accounts)
to_x = account.getPubKeysX(to_accounts)
to_y = account.getPubKeysY(to_accounts)

const amounts = [500, 50]
const tx_token_types = [1, 1]
const swap_from_x = [0, 0]
const swap_from_y = [0, 0]
const swap_to_x = [0, 0]
const swap_to_y = [0, 0]
const swap_amount = [0, 0]
const swap_token_type = [0, 0]

const txArray = txLeaf.generateTxLeafArray(
    from_x, from_y, to_x, to_y, amounts, tx_token_types, swap_from_x, swap_from_y, swap_to_x, swap_to_y, swap_amount, swap_token_type
)

const txLeafHashes = txLeaf.hashTxLeafArray(txArray)

const txTree = merkle.treeFromLeafArray(txLeafHashes)

// const txRoot = merkle.rootFromLeafArray(txLeafHashes)

// const txPos = merkle.generateMerklePosArray(TX_DEPTH)
const txProofs = new Array(2**TX_DEPTH)
for (jj = 0; jj < 2**TX_DEPTH; jj++){
    txProofs[jj] = merkle.getProof(jj, txTree, txLeafHashes)
}

const signatures = txLeaf.signTxLeafHashArray(
    txLeafHashes, 
    [prvKeys[0], prvKeys[1], prvKeys[0], prvKeys[2]]
)

console.log(signatures)

const inputs = update.processTxArray(
    TX_DEPTH,
    pubKeys,
    balanceLeafArray,
    from_accounts_idx,
    to_accounts_idx,
    amounts,
    tx_token_types,
    swap_from_x,
    swap_from_y,
    swap_to_x,
    swap_to_y,
    swap_amount,
    swap_token_type,
    signatures
)

console.log(inputs)

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);
