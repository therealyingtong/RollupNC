include "../circomlib/circuits/mimc.circom";

template TxLeaf() {

    signal input from_x;
    signal input from_y;
    signal input to_x;
    signal input to_y;
    signal input amount;
    signal input token_type_from;

    // atomic swap inputs
    signal private input swap_ok;     // operator sets this flag if it tx is atomic 
    signal private input swap_from_x; // atomic swap tx from address x coordinate
    signal private input swap_from_y; // atomic swap tx from address y coordinate
    signal private input swap_to_x;   // atomic swap tx to address x coordinate
    signal private input swap_to_y;   // atomic swap tx to address y coordinate
    signal private input swap_type;   // atomic swap tx token type
    signal private input swap_amount; // amount required in swap tx

    signal output out;

    component txLeaf = MultiMiMC7(13,91);
    txLeaf.in[0] <== from_x;
    txLeaf.in[1] <== from_y;
    txLeaf.in[2] <== to_x;
    txLeaf.in[3] <== to_y; 
    txLeaf.in[4] <== amount;
    txLeaf.in[5] <== token_type_from;
    txLeaf.in[6] <== swap_ok;
    txLeaf.in[7] <== swap_from_x;
    txLeaf.in[8] <== swap_from_y;
    txLeaf.in[9] <== swap_to_x;
    txLeaf.in[10] <== swap_to_y;
    txLeaf.in[11] <== swap_amount;
    txLeaf.in[12] <== swap_type;
    
    out <== txLeaf.out;
}
