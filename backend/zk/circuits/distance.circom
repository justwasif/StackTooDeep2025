template ExactDistance() {
    // PUBLIC
    signal input playerX;
    signal input playerY;
    signal input treasureHash;

    // PRIVATE
    signal input treasureX;
    signal input treasureY;
    signal input salt;

    // 1. Verify Treasure
    component hasher = Poseidon(3);
    hasher.inputs[0] <== treasureX;
    hasher.inputs[1] <== treasureY;
    hasher.inputs[2] <== salt;
    treasureHash === hasher.out;

    // 2. Calculate Manhattan Distance (|x1-x2| + |y1-y2|)
    component absX = AbsDiff();
    absX.a <== playerX;
    absX.b <== treasureX;

    component absY = AbsDiff();
    absY.a <== playerY;
    absY.b <== treasureY;

    signal output distance;
    distance <== absX.out + absY.out;
}