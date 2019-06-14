pragma solidity >=0.4.21;

import "./AtomicVerifier.sol";


contract IMiMC {

    function MiMCpe7(uint256,uint256) public pure returns(uint256) {}

}

contract Atomic is AtomicVerifier {

    // bal_depth = 2 (i.e. 4 accounts)
    // tx_depth = 1 (i.e. 2 txs)
    
    uint256 public currentRoot;

    /* nice to have: deposit

    bytes32[] public currentDeposits;
    uint[] public pendingDeposits;
    uint public cdLength = 0;

     function deposit(uint pk1) public {
        pendingDeposits.push(pk1);
        if(pendingDeposits.length % 2 == 0){
            bytes32 cd = keccak256(abi.encodePacked(pendingDeposits[0], pendingDeposits[1]));
            delete pendingDeposits;
            currentDeposits.push(cd);
            cdLength ++;
            uint tempLength = cdLength;
            while(tempLength % 2 == 0 && cdLength != 0){
                currentDeposits[currentDeposits.length - 2] = keccak256(abi.encodePacked(currentDeposits[currentDeposits.length - 1], currentDeposits[currentDeposits.length -2]));
                currentDeposits.length --;
                tempLength = tempLength / 2;
            }
        }
    }

    */
    
    function updateState(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[3] memory input // TODO: include tx deltas into input
            // tx deltas: from, to, amt, nonce, type, atom_from, atom_to, atom_amt, atom_type
        ) public {
        require(currentRoot == input[2], "input does not match current root");
        //validate proof
        require(AtomicVerifier.verifyProof(a,b,c,input),
        "SNARK proof is invalid");
        // update merkle root
        currentRoot = input[0];

        emit UpdatedState(input[0], input[1], input[2]); //newRoot, txRoot, oldRoot
    }

}