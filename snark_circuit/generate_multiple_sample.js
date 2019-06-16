const snarkjs = require("snarkjs");
const fs = require("fs");
const account = require("../utils/generate_accounts.js");
const balanceLeaf = require("../utils/generate_balance_leaf.js");
const txLeaf = require("../utils/generate_tx_leaf.js");
const merkle = require("../utils/MiMCMerkle.js")
const update = require("../utils/update.js")
const eddsa = require("../circomlib/src/eddsa.js");
var process = require("process");

const TX_DEPTH = 1
const BAL_DEPTH = 2

// get empty tree hashes
const zeroLeaf = balanceLeaf.zeroLeaf()
const zeroLeafHash = balanceLeaf.zeroLeafHash()
const zeroCache = merkle.getZeroCache(zeroLeafHash, BAL_DEPTH)

// Balance object
balance1 = {
    "secretKey": 1,
    "tokenType": 1,
    "balance": 1000,
    "nonce": 0,
    "id": 0
};

balance2 = {
    "secretKey": 2,
    "tokenType": 1,
    "balance": 20,
    "nonce": 0,
    "id": 1
};

balance3 = {
    "secretKey": 3,
    "tokenType": 1,
    "balance": 200,
    "nonce": 0,
    "id": 2
};

balance4 = {
    "secretKey": 4,
    "tokenType": 1,
    "balance": 100,
    "nonce": 0,
    "id": 3
};

// TX object
tx1 = {
    "fromID": 0,
    "toID": 2,
    "nonce": 0,
    "amount": 500,
    "tokenType": 1,
    // atomic swap fields
    "swapFromID": -1,
    "swapToID": -1,    
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
    "swapFromID": -1,
    "swapToID": -1,
    "swapTokenType": 0,
    "swapAmount": 0
}

//balanceObjs = [balance1, balance2, balance3, balance4 ]
//txObjs = [tx1, tx2];


function balanceCmp(a, b) {
    if (a.id < b.id) {
	return -1;
    }
    if (a.id > b.id) {
	return 1;
    }
    return 0
}
balanceObjs = []
txObjs = []
// read in files from disk
if (process.argv.length >= 4) {
//    txObjs = []
    balanceDir = process.argv[2];
    txDir = process.argv[3];

//    console.log('txDir', txDir)
//    console.log('balanceDir', balanceDir)

    fs.readdirSync(balanceDir).forEach(function (file) {
	balanceObjs.push(JSON.parse(fs.readFileSync(balanceDir+'/'+file)))
    });
    balanceObjs.sort(balanceCmp)

    fs.readdirSync(txDir).forEach(function (file) {
	txObjs.push(JSON.parse(fs.readFileSync(txDir+'/'+file)))
    });
} else {
    throw("please provide paths to input directories")
}

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
    token_types.push(balanceObjs[i]["tokenType"])
    balances.push(balanceObjs[i]["balance"])
    nonces.push(balanceObjs[i]["nonce"])
}
pubKeys = account.generatePubKeys(prvKeys)
for (i = 0; i < balanceObjs.length; i++) {
    pubKeyXs.push(pubKeys[i][0])
    pubKeyYs.push(pubKeys[i][1])
}
    

//console.log('privkeys', prvKeys);
//console.log('pubkeyXs', pubKeyXs);
//console.log('pubkeyYs', pubKeyYs);

// generate balance leaves for user accounts
const balanceLeafArray = balanceLeaf.generateBalanceLeafArray(
    pubKeyXs, pubKeyYs, token_types, balances, nonces
)

// generate tx's: 
// 1. Alice --500--> Charlie , 
// 2. Daenerys --50--> Bob,

from_accounts_idx = [txObjs[0]["fromID"], txObjs[1]["fromID"]]

to_accounts_idx = [txObjs[0]["toID"], txObjs[1]["toID"]]

from_x = [pubKeyXs[txObjs[0]["fromID"]], pubKeyXs[txObjs[1]["fromID"]]]
from_y = [pubKeyYs[txObjs[0]["fromID"]], pubKeyYs[txObjs[1]["fromID"]]]
to_x = [pubKeyXs[txObjs[0]["toID"]], pubKeyXs[txObjs[1]["toID"]]]
to_y = [pubKeyYs[txObjs[0]["toID"]], pubKeyYs[txObjs[1]["toID"]]]

// swap (to, from)
//const swap_to_idx = [1, 2]
//const swap_from_idx = [3, 0]
    
amounts = [txObjs[0]["amount"], txObjs[1]["amount"]]
tx_token_types = [txObjs[0]["tokenType"], txObjs[1]["tokenType"]]
tx_nonces = [txObjs[0]["nonce"], txObjs[1]["nonce"]]
swap_to_idx = [txObjs[0]["swapToID"], txObjs[1]["swapToID"]]
swap_from_idx = [txObjs[0]["swapFromID"], txObjs[1]["swapFromID"]]
swap_from_x = []
swap_from_y = []
swap_to_x = []
swap_to_y = []
for (i = 0; i < txObjs.length; i++) {
    if (swap_from_idx[i] == -1 || swap_to_idx[i] == -1) {
	swap_from_x.push(0)
	swap_from_y.push(0)
	swap_to_x.push(0)
	swap_to_y.push(0)
    } else{
	swap_from_x.push(pubKeyXs[swap_from_idx[i]])
	swap_from_y.push(pubKeyYs[swap_from_idx[i]])
	swap_to_x.push(pubKeyXs[swap_to_idx[i]])
	swap_to_y.push(pubKeyYs[swap_to_idx[i]])
    }
}

swap_amount = [txObjs[0]["swapAmount"], txObjs[1]["swapAmount"]]
swap_token_type = [txObjs[0]["swapTokenType"], txObjs[1]["swapTokenType"]]

const txArray = txLeaf.generateTxLeafArray(
    from_x, from_y, to_x, to_y, tx_nonces, amounts, tx_token_types, swap_from_x, swap_from_y, swap_to_x, swap_to_y, swap_amount, swap_token_type
)

//console.log('txArray', txArray)

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
