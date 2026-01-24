template HotCold() {
    // PUBLIC
    signal input playerX;
    signal input playerY;
    signal input threshold; // e.g., 4 units
    signal input treasureHash; // Commitment to treasure location

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

    // 2. Calculate Squared Euclidean Distance
    // (dx^2 + dy^2) is cheaper than square root
    signal diffX <== playerX - treasureX;
    signal diffY <== playerY - treasureY;
    
    signal distSq <== (diffX * diffX) + (diffY * diffY);
    signal threshSq <== threshold * threshold;

    // 3. Compare: distSq < threshSq ?
    component lt = LessThan(64);
    lt.in[0] <== distSq;
    lt.in[1] <== threshSq;

    signal output isHot;
    isHot <== lt.out;
}