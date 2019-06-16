include "./tx_leaf.circom";
include "./leaf_existence.circom";
include "../circomlib/circuits/eddsamimc.circom";

template TxExistence(k){
// m is depth of tx tree

    signal input from_x;
    signal input from_y;
    signal input to_x;
    signal input to_y;
    signal input nonce;
    signal input amount;
    signal input token_type_from;
    signal input swap_from_x;
    signal input swap_from_y;
    signal input swap_to_x;
    signal input swap_to_y;
    signal input swap_amount;
    signal input swap_token_type;    

    signal input tx_root;
    signal input paths2_root_pos[k];
    signal input paths2_root[k];

    signal input R8x;
    signal input R8y;
    signal input S;

    component txLeaf = TxLeaf();
    txLeaf.from_x <== from_x;
    txLeaf.from_y <== from_y;
    txLeaf.to_x <== to_x;
    txLeaf.to_y <== to_y;
    txLeaf.nonce <== nonce; 
    txLeaf.amount <== amount;
    txLeaf.token_type <== token_type_from;
    txLeaf.swap_from_x <== swap_from_x;
    txLeaf.swap_from_y <== swap_from_y;
    txLeaf.swap_to_x <== swap_to_x;
    txLeaf.swap_to_y <== swap_to_y;
    txLeaf.swap_amount <== swap_amount;
    txLeaf.swap_token_type <== swap_token_type;    

    component txExistence = LeafExistence(k);
    txExistence.leaf <== txLeaf.out;
    txExistence.root <== tx_root;

    for (var q = 0; q < k; q++){
        txExistence.paths2_root_pos[q] <== paths2_root_pos[q];
        txExistence.paths2_root[q] <== paths2_root[q];
    }
    
    component verifier = EdDSAMiMCVerifier();   
    verifier.enabled <== 1;
    verifier.Ax <== from_x;
    verifier.Ay <== from_y;
    verifier.R8x <== R8x
    verifier.R8y <== R8y
    verifier.S <== S;
    verifier.M <== txLeaf.out;

}

