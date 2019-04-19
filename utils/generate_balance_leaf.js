const mimcjs = require("../circomlib/src/mimc7.js");

module.exports = {

    generateBalanceLeafArray: function(accts_x, accts_y, token_types, balances, nonces){
        if (Array.isArray(accts_x)){
            balanceLeafArray = [];
            for (i = 0; i < accts_x.length; i++){
                leaf = {}
                leaf['pubKey_x'] = accts_x[i];
                leaf['pubKey_y'] = accts_y[i];
                leaf['balance'] = balances[i];
                leaf['nonce'] = nonces[i];
                leaf['token_type'] = token_types[i];
                balanceLeafArray.push(leaf);
            }
            return balanceLeafArray;
        } else {
            console.log('please enter values as arrays.')
        }

    },

    hashBalanceLeafArray: function(leafArray){
        if (Array.isArray(leafArray)){
            balanceLeafHashArray = [];
            for (i = 0; i < leafArray.length; i++){
                leafHash = mimcjs.multiHash([
                    leafArray[i]['pubKey_x'].toString(),
                    leafArray[i]['pubKey_y'].toString(),
                    leafArray[i]['balance'].toString(),
                    leafArray[i]['nonce'].toString(),
                    leafArray[i]['token_type'].toString()
                ])
                balanceLeafHashArray.push(leafHash)
            }
            return balanceLeafHashArray
        } else {
            console.log('please enter values as arrays.')
        }
    }
    
}
