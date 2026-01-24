template CloserFarther() {
    // PUBLIC
    signal input oldX;
    signal input oldY;
    signal input newX;
    signal input newY;
    signal input treasureHash;

    // PRIVATE
    signal input treasureX;
    signal input treasureY;
    signal input salt;

    // 1. Verify Treasure Integrity
    component hasher = Poseidon(3);
    hasher.inputs[0] <== treasureX;
    hasher.inputs[1] <== treasureY;
    hasher.inputs[2] <== salt;
    treasureHash === hasher.out;

    // 2. Calculate Old Squared Distance
    signal oldDiffX <== oldX - treasureX;
    signal oldDiffY <== oldY - treasureY;
    signal oldDistSq <== (oldDiffX * oldDiffX) + (oldDiffY * oldDiffY);

    // 3. Calculate New Squared Distance
    signal newDiffX <== newX - treasureX;
    signal newDiffY <== newY - treasureY;
    signal newDistSq <== (newDiffX * newDiffX) + (newDiffY * newDiffY);

    // 4. Compare: New < Old ?
    component lt = LessThan(64);
    lt.in[0] <== newDistSq;
    lt.in[1] <== oldDistSq;

    signal output gotCloser;
    gotCloser <== lt.out;
}