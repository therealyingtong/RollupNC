include "../circomlib/circuits/comparators.circom"
include "./if-gadgets.circom"

// ParityGadget outputs boolean b on even numbered outputs and not(b) on odd numbers.
template ParityGadget(k){
    signal input b;
    signal output out[k+1];

    component toBool = ToBool();
    toBool.x <== b;
    out[0] <== toBool.out;
    
    component flipper[k+1];
    flipper[0] = IsZero();
    flipper[0].in <== toBool.out;
    
    for (var i =0; i < k; i++) {
    	// Add a NOT gate and connect signal
    	flipper[i+1] = IsZero();
	flipper[i+1].in <== flipper[i].out;

	out[i+1] <== flipper[i].out;
    }
}


template Padder(k){
    signal input in[k];
    signal output out[k+2];

    out[0] <== 0;
    out[k+1] <== 0;

    for (var i = 0; i < k; i++) {
        out[i+1] <== in[i];
    }
}

// This simulates use of parity gadget as we want to use it for atomic swaps.
// We want to constrain equality of inputs that are next to each other
// (4, 4, 5, 5) should work but (1, 1, 1, 2)
// should not.
template ParityGadgetCheck(k){
    signal input in[k];

    var ZERO = 0;
    component paddedIn = Padder(k);
    for (var i = 0; i < k; i++) {
    	paddedIn.in[i] <== in[i];
    }

    component parity = ParityGadget(k);
    parity.b <== ZERO;
    component switcher[k];
    for (var i = 0; i < k; i++) {
        switcher[i] = Switcher();                                                                
	// paddedIn.out[i] is the same as in[i-1]
        switcher[i].L <== paddedIn.out[i];
	switcher[i].R <== paddedIn.out[i+2];
	switcher[i].sel <== parity.out[i];
	
	in[i] === switcher[i].outR;
    }
}

component main = ParityGadgetCheck(8);