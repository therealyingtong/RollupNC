const snarkjs = require("snarkjs");
const fs = require("fs");
const account = require("../utils/generate_accounts.js");
const balanceLeaf = require("../utils/generate_balance_leaf.js");
const txLeaf = require("../utils/generate_tx_leaf.js");
const merkle = require("../utils/MiMCMerkle.js")
const update = require("../utils/update.js")
const eddsa = require("../circomlib/src/eddsa.js");

const TX_DEPTH = 2
const BAL_DEPTH = 4

// get empty tree hashes
const zeroLeaf = balanceLeaf.zeroLeaf()

// console.log(merkle.getZeroCache(zeroLeafHash, 5))
// generate Coordinator, A, B, C, D, E, F accounts with the following parameters
const num_accts = 7;
const prvKeys = account.generatePrvKeys(num_accts);
const zeroPubKey = account.zeroAddress()
const pubKeys = account.generatePubKeys(prvKeys);
pubKeys.unshift(zeroPubKey)

const token_types = [0, 0, 2, 1, 2, 1, 2, 1];
const balances = [0, 0, 1000, 20, 200, 100, 500, 20];
const nonces = [0, 0, 0, 0, 0, 0, 0, 0];

// generate balance leaves for user accounts
const balanceLeafArray = balanceLeaf.generateBalanceLeafArray(
    account.getPubKeysX(pubKeys),
    account.getPubKeysY(pubKeys),
    token_types, balances, nonces
)

const paddedTo16BalanceLeafArray = merkle.padLeafHashArray(balanceLeafArray, zeroLeaf, 8)

// generate tx's: 
// 1. Alice --500--> Charlie , 
// 2. Charlie --200--> withdraw,
// 3. Bob --10--> Daenerys,
// 4. empty tx (operator --0--> withdraw)

from_accounts_idx = [2, 4, 3, 1]
from_accounts = update.pickByIndices(pubKeys, from_accounts_idx)

to_accounts_idx = [4, 0, 5, 0]
to_accounts = update.pickByIndices(pubKeys, to_accounts_idx)

from_x = account.getPubKeysX(from_accounts)
from_y = account.getPubKeysY(from_accounts)
to_x = account.getPubKeysX(to_accounts)
to_y = account.getPubKeysY(to_accounts)
const amounts = [500, 200, 10, 0]
const tx_token_types = [2, 2, 1, 0]
const tx_nonces = [0, 0, 0, 0]

const txArray = txLeaf.generateTxLeafArray(
    from_x, from_y, to_x, to_y, tx_nonces, amounts, tx_token_types
)

const txLeafHashes = txLeaf.hashTxLeafArray(txArray)

signingPrvKeys = new Array()
from_accounts_idx.forEach(function(index){
    signingPrvKeys.push(prvKeys[index - 1])
})

const signatures = txLeaf.signTxLeafHashArray(
    txLeafHashes, 
    signingPrvKeys
)


const inputs = update.processTxArray(
    TX_DEPTH,
    BAL_DEPTH,
    pubKeys,
    paddedTo16BalanceLeafArray,
    from_accounts_idx,
    to_accounts_idx,
    tx_nonces,
    amounts,
    tx_token_types,
    signatures
)

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);