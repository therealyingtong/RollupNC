const snarkjs = require("snarkjs");
const fs = require("fs");
const account = require("../utils/generate_accounts.js");
const balanceLeaf = require("../utils/generate_balance_leaf.js");
const txLeaf = require("../utils/generate_tx_leaf.js");
const merkle = require("../utils/MiMCMerkle.js")
const update = require("../utils/update.js")
const eddsa = require("../circomlib/src/eddsa.js");

const TX_DEPTH = 1
const BAL_DEPTH = 2

// get empty tree hashes
const zeroLeaf = balanceLeaf.zeroLeaf()
const zeroLeafHash = balanceLeaf.zeroLeafHash()
const zeroCache = merkle.getZeroCache(zeroLeafHash, BAL_DEPTH)

// Balance object
balance1 = {
    "secretKey": 1,
    "pubX": 5686635804472582232015924858874568287077998278299757444567424097636989354076n,
    "pubY": 20652491795398389193695348132128927424105970377868038232787590371122242422611n,
    "tokenType": 1,
    "balance": 1000,
    "nonce": 0,
    "id": 0
};

balance2 = {
    "secretKey": 2,
    "pubX": 5188413625993601883297433934250988745151922355819390722918528461123462745458n,
    "pubY": 12688531930957923993246507021135702202363596171614725698211865710242486568828n,
    "tokenType": 1,
    "balance": 20,
    "nonce": 0,
    "id": 1

};

balance3 = {
    "secretKey": 3,
    "pubX": 3765814648989847167846111359329408115955684633093453771314081145644228376874n,
    "pubY": 9087768748788939667604509764703123117669679266272947578075429450296386463456n,
    "tokenType": 1,
    "balance": 200,
    "nonce": 0,
    "id": 2
};

balance4 = {
    "secretKey": 4,
    "pubX": 1762022020655193103898710344498807340207430243997238950919845130297394445492n,
    "pubY": 8832411107013507530516405716520512990480512909708424307433374075372921372064n,
    "tokenType": 1,
    "balance": 100,
    "nonce": 0,
    "id": 3
};

balanceObjs = [balance1, balance2, balance3, balance4];

// console.log(merkle.getZeroCache(zeroLeafHash, 5))
// generate Coordinator, A, B, C, D, E, F accounts with the following parameters
prvKeys = []
pubKeyXs = []
pubKeyYs = []
pubKeys = []
token_types = []
balances = []
nonces = []
for (i = 0; i < balanceObjs.length; i++) {
    prvKeys.push(account.prvKeyFromInt(balanceObjs[i]["secretKey"]))
    pubKeyXs.push(balanceObjs[i]["pubX"])
    pubKeyYs.push(balanceObjs[i]["pubY"])
    pubKeys.push([pubKeyXs[i], pubKeyYs[i]])
    token_types.push(balanceObjs[i]["tokenType"])
    balances.push(balanceObjs[i]["balance"])
    nonces.push(balanceObjs[i]["nonce"])
}
//pubKeys.unshift(zeroPubKey)

console.log('privkeys', prvKeys);
console.log('pubkeyXs', pubKeyXs);
console.log('pubkeyYs', pubKeyYs);

// generate balance leaves for user accounts
const balanceLeafArray = balanceLeaf.generateBalanceLeafArray(
    pubKeyXs, pubKeyYs, token_types, balances, nonces
)

// generate tx's: 
// 1. Alice --500--> Charlie , 
// 2. Daenerys --50--> Bob,

// TX object
tx1 = {
    "fromID": 0,
    "toID": 2,
    "nonce": 0,
    "amount": 500,
    "tokenType": 1,
    // atomic swap fields
    "swapFromX": 0,
    "swapFromY": 0,
    "swapToX": 0,
    "swapToY": 0,
    "swapTokenType": 0,
    "swapAmount": 0
}

tx2 = {
    "fromID": 3,
    "toID": 1,
    "nonce": 0,
    "amount": 50,
    "tokenType": 1,
    // atomic swap fields
    "swapFromX": 0,
    "swapFromY": 0,
    "swapToX": 0,
    "swapToY": 0,
    "swapTokenType": 0,
    "swapAmount": 0
}

from_accounts_idx = [tx1["fromID"], tx2["fromID"]]

to_accounts_idx = [tx1["toID"], tx2["toID"]]

from_x = [balanceObjs[tx1["fromID"]]["pubX"], balanceObjs[tx2["fromID"]]["pubX"]]
from_y = [balanceObjs[tx1["fromID"]]["pubY"], balanceObjs[tx2["fromID"]]["pubY"]]
to_x = [balanceObjs[tx1["toID"]]["pubX"], balanceObjs[tx2["toID"]]["pubX"]]
to_y = [balanceObjs[tx1["toID"]]["pubY"], balanceObjs[tx2["toID"]]["pubY"]]

// swap (to, from)
//const swap_to_idx = [1, 2]
//const swap_from_idx = [3, 0]
    
amounts = [tx1["amount"], tx2["amount"]]
tx_token_types = [tx1["tokenType"], tx2["tokenType"]]
tx_nonces = [tx1["nonce"], tx2["nonce"]]
swap_from_x = [tx1["swapFromX"], tx2["swapFromX"]]
swap_from_y =[tx1["swapFromY"], tx2["swapFromY"]]
swap_to_x = [tx1["swapToX"], tx2["swapToX"]]
swap_to_y = [tx1["swapToY"], tx2["swapToY"]]
swap_amount = [tx1["swapAmount"], tx2["swapAmount"]]
swap_token_type = [tx1["swapTokenType"], tx2["swapTokenType"]]

const txArray = txLeaf.generateTxLeafArray(
    from_x, from_y, to_x, to_y, tx_nonces, amounts, tx_token_types, swap_from_x, swap_from_y, swap_to_x, swap_to_y, swap_amount, swap_token_type
)

console.log('txArray', txArray)

const txLeafHashes = txLeaf.hashTxLeafArray(txArray)

const txTree = merkle.treeFromLeafArray(txLeafHashes)

// const txRoot = merkle.rootFromLeafArray(txLeafHashes)

// const txPos = merkle.generateMerklePosArray(TX_DEPTH)
const txProofs = new Array(2**TX_DEPTH)
for (jj = 0; jj < 2**TX_DEPTH; jj++){
    txProofs[jj] = merkle.getProof(jj, txTree, txLeafHashes)
}

signingPrvKeys = new Array()
from_accounts_idx.forEach(function(index){
    signingPrvKeys.push(prvKeys[index])
})

const signatures = txLeaf.signTxLeafHashArray(
    txLeafHashes, 
    signingPrvKeys
)

// for (i = 0; i < from_accounts.length; i++){
//     console.log(
//         eddsa.verifyMiMC(txLeafHashes[i], signatures[i], from_accounts[i])
//     )
// }

const inputs = update.processTxArray(
    TX_DEPTH,
    BAL_DEPTH,
    pubKeys,
    balanceLeafArray,
    from_accounts_idx,
    to_accounts_idx,
    tx_nonces,
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

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);
