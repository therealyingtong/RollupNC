include "../circomlib/circuits/mimc.circom";
include "../circomlib/circuits/eddsamimc.circom";
include "../circomlib/circuits/bitify.circom";
include "../circomlib/circuits/comparators.circom";
include "./tx_existence_check.circom";
include "./balance_existence_check.circom";
include "./balance_leaf.circom";
include "./get_merkle_root.circom";
include "./if-gadgets.circom";
include "./parity.circom";
include "./checkleaves.circom";

template Main(n,m) {
// n is depth of balance tree
// m is depth of transactions tree
// for each proof, update 2**m transactions

    // Merkle root of transactions tree
    signal input tx_root;

    // Merkle proof for transaction in tx tree
    signal private input paths2tx_root[2**m, m];

    // binary vector indicating whether node in tx proof is left or right
    signal private input paths2tx_root_pos[2**m, m];

    // Merkle root of old balance tree
    signal input current_state;

    // intermediate roots (two for each tx).  Final element is last.
    signal private input intermediate_roots[2**(m+1)+1];

    // Merkle proof for sender account in balance tree
    signal private input paths2root_from[2**m, n];

    // Merkle proof for receiver account in balance tree
    signal private input paths2root_to[2**m, n];

    // binary vector indicating whether node in balance proof for sender account
    // is left or right 
    signal private input paths2root_from_pos[2**m, n];

    // binary vector indicating whether node in balance proof for receiver account
    // is left or right 
    signal private input paths2root_to_pos[2**m, n];
    
    signal private input from_x[2**m]; //sender address x coordinate
    signal private input from_y[2**m]; //sender address y coordinate
    signal private input R8x[2**m]; // sender signature
    signal private input R8y[2**m]; // sender signature
    signal private input S[2**m]; // sender signature

    signal private input nonce_from[2**m]; // sender account nonce
    signal private input to_x[2**m]; // receiver address x coordinate
    signal private input to_y[2**m]; // receiver address y coordinate
    signal private input nonce_to[2**m]; // receiver account nonce
    signal private input amount[2**m]; // amount being transferred

    signal private input token_balance_from[2**m]; // sender token balance
    signal private input token_balance_to[2**m]; // receiver token balance
    signal private input token_type_from[2**m]; // sender token type
    signal private input token_type_to[2**m]; // receiver token type

    // Atomic Swap tx fields
    signal private input swap_from_x[2**m];
    signal private input swap_from_y[2**m];
    signal private input swap_to_x[2**m];
    signal private input swap_to_y[2**m];
    signal private input swap_amount[2**m];
    signal private input swap_token_type[2**m];

    // new balance tree Merkle root
    signal output out;

    // Constants
    var ZERO_ADDRESS_X = 0000000000000000000000000000000000000000000000000000000000000000000000000000;
    var ZERO_ADDRESS_Y = 00000000000000000000000000000000000000000000000000000000000000000000000000000;
    var ZERO = 0;
    var ATOMIC_FIELDS = 6;

    //-----ATOMIC SWAP SETUP-----//
    // Padding inputs for atomic swap
    component padded_to_x = Padder(2**m);
    component padded_to_y = Padder(2**m);
    component padded_from_x = Padder(2**m);
    component padded_from_y = Padder(2**m);
    component padded_amount = Padder(2**m);
    component padded_token_type = Padder(2**m);

    for (var k = 0; k < 2**m; k++) {
        padded_to_x.in[k] <== to_x[k];
        padded_to_y.in[k] <== to_y[k];
        padded_from_x.in[k] <== from_x[k];
        padded_from_y.in[k] <== from_y[k];
        padded_amount.in[k] <== amount[k];
        padded_token_type.in[k] <== token_type_from[k];
    }

    component parity = ParityGadget(2**m);
    parity.b <== ZERO;
    component atomicSwitcher[2**m, ATOMIC_FIELDS];
    component atomicChecker[2**m];
    //-----END ATOMIC SWAP SETUP-----//

    var NONCE_MAX_VALUE = 100;

    component txExistence[2**m];
    component senderExistence[2**m];
    component ifBothHighForceEqual[2**m];
    component newSender[2**m];
    component merkle_root_from_new_sender[2**m];
    component receiverExistence[2**m];
    component newReceiver[2**m];
    component allLow[2**m];
    component ifThenElse[2**m];        
    component merkle_root_from_new_receiver[2**m];

    current_state === intermediate_roots[0];

    for (var i = 0; i < 2**m; i++) {
        //-----TX EXISTENCE AND SIG CHECK -----//
        txExistence[i] = TxExistence(m);
	txExistence[i].from_x <== from_x[i];
    	txExistence[i].from_y <== from_y[i];
        txExistence[i].to_x <== to_x[i];
        txExistence[i].to_y <== to_y[i];
	txExistence[i].nonce <== nonce_from[i];
	txExistence[i].amount <== amount[i];
	txExistence[i].token_type_from <== token_type_from[i];
	txExistence[i].swap_from_x <== swap_from_x[i];
	txExistence[i].swap_from_y <== swap_from_y[i];
	txExistence[i].swap_to_x <== swap_to_x[i];
	txExistence[i].swap_to_y <== swap_to_y[i];
	txExistence[i].swap_amount <== swap_amount[i];
	txExistence[i].swap_token_type <== swap_token_type[i];
	
	txExistence[i].tx_root <== tx_root;

        for (var j = 0; j < m; j++){
            txExistence[i].paths2_root_pos[j] <== paths2tx_root_pos[i, j] ;
            txExistence[i].paths2_root[j] <== paths2tx_root[i, j];
        }

    	txExistence[i].R8x <== R8x[i];
    	txExistence[i].R8y <== R8y[i];
    	txExistence[i].S <== S[i];
    	//-----END TX EXISTENCE AND SIG CHECK -----//

        //-----SENDER IN TREE 1 BEFORE DEDUCTING CHECK -----//
        senderExistence[i] = BalanceExistence(n);
        senderExistence[i].x <== from_x[i];
        senderExistence[i].y <== from_y[i];
        senderExistence[i].token_balance <== token_balance_from[i];
        senderExistence[i].nonce <== nonce_from[i];
        senderExistence[i].token_type <== token_type_from[i];

        senderExistence[i].balance_root <== intermediate_roots[2*i];
        for (var j = 0; j < n; j++){
            senderExistence[i].paths2_root_pos[j] <== paths2root_from_pos[i, j];
            senderExistence[i].paths2_root[j] <== paths2root_from[i, j];
        }
        //-----END SENDER IN TREE 1 BEFORE DEDUCTING CHECK -----//

       //-----CHECK TOKEN TYPES === IF NON-WITHDRAWS-----//
       ifBothHighForceEqual[i] = IfBothHighForceEqual();
       ifBothHighForceEqual[i].check1 <== to_x[i];
       ifBothHighForceEqual[i].check2 <== to_y[i];
       ifBothHighForceEqual[i].a <== token_type_to[i];
       ifBothHighForceEqual[i].b <== token_type_from[i];
       //-----END CHECK TOKEN TYPES-----//    

	//-----ATOMIC SWAP CONSTRAINTS-----//
        atomicChecker[i] = CheckLeaves();
	atomicChecker[i].tx1_swap_from_x <== swap_from_x[i];
	atomicChecker[i].tx1_swap_from_y <== swap_from_y[i];
	atomicChecker[i].tx1_swap_to_x <== swap_to_x[i];
	atomicChecker[i].tx1_swap_to_y <== swap_to_y[i];
	atomicChecker[i].tx1_swap_amount <== swap_amount[i];
	atomicChecker[i].tx1_swap_type <== token_type_from[i];

	for (var j = 0; j < ATOMIC_FIELDS; j++) {
	    atomicSwitcher[i,j] = Switcher();
	    atomicSwitcher[i,j].sel <== parity.out[i];
	}
        atomicSwitcher[i,0].L <== padded_from_x.out[i];
        atomicSwitcher[i,0].R <== padded_from_x.out[i+2];
	atomicChecker[i].tx2_from_x <== atomicSwitcher[i,0].outR;
        atomicSwitcher[i,1].L <== padded_from_y.out[i];
        atomicSwitcher[i,1].R <== padded_from_y.out[i+2];
	atomicChecker[i].tx2_from_y <== atomicSwitcher[i,1].outR;
        atomicSwitcher[i,2].L <== padded_to_x.out[i];
        atomicSwitcher[i,2].R <== padded_to_x.out[i+2];
	atomicChecker[i].tx2_to_x <== atomicSwitcher[i,2].outR;
        atomicSwitcher[i,3].L <== padded_to_y.out[i];
        atomicSwitcher[i,3].R <== padded_to_y.out[i+2];
	atomicChecker[i].tx2_to_y <== atomicSwitcher[i,3].outR;
        atomicSwitcher[i,4].L <== padded_amount.out[i];
        atomicSwitcher[i,4].R <== padded_amount.out[i+2];
	atomicChecker[i].tx2_amount <== atomicSwitcher[i,4].outR;
        atomicSwitcher[i,5].L <== padded_token_type.out[i];
        atomicSwitcher[i,5].R <== padded_token_type.out[i+2];
	atomicChecker[i].tx2_type <== atomicSwitcher[i,5].outR;				
	//-----END ATOMIC SWAP CONSTRAINTS-----//

	//-----CHECK SENDER IN TREE 2 AFTER DEDUCTING-----//
        // subtract amount from sender balance; increase sender nonce 
        newSender[i] = BalanceLeaf();
        newSender[i].x <== from_x[i];
        newSender[i].y <== from_y[i];
        newSender[i].token_balance <== token_balance_from[i] - amount[i];
        newSender[i].nonce <== nonce_from[i] + 1;
        newSender[i].token_type <== token_type_from[i];

        // get intermediate root from new sender leaf
        merkle_root_from_new_sender[i] = GetMerkleRoot(n);
        merkle_root_from_new_sender[i].leaf <== newSender[i].out;
        for (var j = 0; j < n; j++){
            merkle_root_from_new_sender[i].paths2_root[j] <== paths2root_from[i, j];
            merkle_root_from_new_sender[i].paths2_root_pos[j] <== paths2root_from_pos[i, j];
        }

        // check that intermediate root is consistent with input
        merkle_root_from_new_sender[i].out === intermediate_roots[2*i  + 1];
	//-----END SENDER IN TREE 2 AFTER DEDUCTING CHECK-----//

	//-----RECEIVER IN TREE 2 BEFORE INCREMENTING CHECK-----//
        receiverExistence[i] = BalanceExistence(n);
        receiverExistence[i].x <== to_x[i];
        receiverExistence[i].y <== to_y[i];
        receiverExistence[i].token_balance <== token_balance_to[i];
        receiverExistence[i].nonce <== nonce_to[i];
        receiverExistence[i].token_type <== token_type_to[i];

        receiverExistence[i].balance_root <== intermediate_roots[2*i + 1];
        for (var j = 0; j < n; j++){
            receiverExistence[i].paths2_root_pos[j] <== paths2root_to_pos[i, j] ;
            receiverExistence[i].paths2_root[j] <== paths2root_to[i, j];
        }
	//-----END CHECK RECEIVER IN TREE 2 BEFORE INCREMENTING-----//

	//-----CHECK RECEIVER IN TREE 3 AFTER INCREMENTING-----//
	newReceiver[i] = BalanceLeaf();
        newReceiver[i].x <== to_x[i];
        newReceiver[i].y <== to_y[i];

        // if receiver is zero address, do not change balance
        // otherwise add amount to receiver balance
	allLow[i] = AllLow(2);
	allLow[i].in[0] <== to_x[i];
	allLow[i].in[1] <== to_y[i];

	ifThenElse[i] = IfAThenBElseC();
	ifThenElse[i].aCond <== allLow[i].out;
	ifThenElse[i].bBranch <== token_balance_to[i];
	ifThenElse[i].cBranch <== token_balance_to[i] + amount[i];
	
	newReceiver[i].token_balance <== ifThenElse[i].out;
        newReceiver[i].nonce <== nonce_to[i];
        newReceiver[i].token_type <== token_type_to[i];

        // get intermediate root from new receiver leaf
        merkle_root_from_new_receiver[i] = GetMerkleRoot(n);
        merkle_root_from_new_receiver[i].leaf <== newReceiver[i].out;
        for (var j = 0; j < n; j++){
            merkle_root_from_new_receiver[i].paths2_root[j] <== paths2root_to[i, j];
            merkle_root_from_new_receiver[i].paths2_root_pos[j] <== paths2root_to_pos[i, j];
        }

        // check that intermediate root is consistent with input
        merkle_root_from_new_receiver[i].out === intermediate_roots[2*i  + 2];
	//-----END CHECK RECEIVER IN TREE 3 AFTER INCREMENTING-----//
    }
    out <== merkle_root_from_new_receiver[2**m-1].out;
}

component main = Main(2,1);