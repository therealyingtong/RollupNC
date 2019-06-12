// SwapCheck checks that all the swap conditions are met
// by the tx attempting to satisfy the conditions
template SwapCheck(){

    // Inputs corresponding to swap conditions on one tx
    signal input swap_from_x;
    signal input swap_from_y;
    signal input swap_to_x;
    signal input swap_to_y;
    signal input swap_amount;
    signal input swap_token_type;

    // Inputs corresponding to a tx (maybe) satisfying swap conditions
    signal input tx_from_x;
    signal input tx_from_y;
    signal input tx_to_x;
    signal input tx_to_y;
    signal input tx_amount;
    signal input tx_token_type;

    swap_from_x === tx_from_x;
    swap_from_y === tx_from_y;
    swap_to_x === tx_to_x;
    swap_to_y === tx_to_y;

    // constraint on token type and amount
    swap_token_type === tx_token_type;
    swap_amount === tx_amount;
}