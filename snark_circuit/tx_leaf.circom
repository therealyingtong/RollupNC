include "../circomlib/circuits/mimc.circom";

template TxLeaf() {

    signal input from_x;
    signal input from_y;
    signal input to_x;
    signal input to_y;
    signal input nonce;
    signal input amount;
    signal input token_type;
    signal input swap_from_x;
    signal input swap_from_y;
    signal input swap_to_x;
    signal input swap_to_y;
    signal input swap_amount;
    signal input swap_token_type; 

    signal output out;

    component txLeaf = MultiMiMC7(13,91);
    txLeaf.in[0] <== from_x;
    txLeaf.in[1] <== from_y;
    txLeaf.in[2] <== to_x;
    txLeaf.in[3] <== to_y; 
    txLeaf.in[4] <== nonce;
    txLeaf.in[5] <== amount;
    txLeaf.in[6] <== token_type;
    txLeaf.in[7] <== swap_from_x;
    txLeaf.in[8] <== swap_from_y;
    txLeaf.in[9] <== swap_to_x;
    txLeaf.in[10] <== swap_to_y;
    txLeaf.in[11] <== swap_amount;
    txLeaf.in[12] <== swap_token_type;
    
    

    out <== txLeaf.out;
}
