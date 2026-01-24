template PlaceWall(rows, cols) {
    // PUBLIC
    signal input targetX;
    signal input targetY;
    signal input mapHash;

    // PRIVATE
    signal input mapGrid[rows][cols];
    signal input salt;

    // 1. Verify Map Integrity (Row Hashing Technique)
    component rowHashers[rows];
    for (var i = 0; i < rows; i++) {
        rowHashers[i] = Poseidon(cols);
        for (var j = 0; j < cols; j++) {
            rowHashers[i].inputs[j] <== mapGrid[i][j];
        }
    }
    component finalHasher = Poseidon(rows + 1);
    for (var i = 0; i < rows; i++) {
        finalHasher.inputs[i] <== rowHashers[i].out;
    }
    finalHasher.inputs[rows] <== salt;
    mapHash === finalHasher.out;

    // 2. Select the Cell at (targetX, targetY)
    signal cellValue;
    var acc = 0;
    
    component isRow[rows];
    component isCol[cols];
    
    for (var i = 0; i < rows; i++) {
        isRow[i] = IsZero();
        isRow[i].in <== targetY - i;
        
        for (var j = 0; j < cols; j++) {
            if (i == 0) { // Instantiate cols once
                isCol[j] = IsZero();
                isCol[j].in <== targetX - j;
            }
            // Add value if row & col match
            acc += mapGrid[i][j] * isRow[i].out * isCol[j].out;
        }
    }
    cellValue <== acc;

    // 3. Constraint: Cell MUST be 0 (Empty)
    // If cellValue is 1 (Wall), this constraint fails.
    cellValue === 0;
}