pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

template RamMove(rows, cols) {
    //PUBLIC INPUTS
    signal input oldX;
    signal input oldY;
    signal input newX;
    signal input newY;
    signal input mapHash;    
    signal input ramActive;  

    //  PRIVATE INPUTS
    signal input mapGrid[rows][cols]; 
    signal input salt;                

    // Verify Map Integrity
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

    //  Verify Step Validity
    signal diffX;
    diffX <== newX - oldX;
    
    signal diffY;
    diffY <== newY - oldY;

    signal diffXSq;
    diffXSq <== diffX * diffX;
    
    signal diffYSq;
    diffYSq <== diffY * diffY;

    diffXSq + diffYSq === 1;

    //  The Wall Selector 
    component isRow[rows];
    signal rowMatch[rows];
    for (var i = 0; i < rows; i++) {
        isRow[i] = IsZero();
        isRow[i].in <== newY - i;
        rowMatch[i] <== isRow[i].out;
    }

    component isCol[cols];
    signal colMatch[cols];
    for (var j = 0; j < cols; j++) {
        isCol[j] = IsZero();
        isCol[j].in <== newX - j;
        colMatch[j] <== isCol[j].out;
    }

    signal isTarget[rows][cols];
    signal cellHit[rows][cols];

    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            isTarget[i][j] <== rowMatch[i] * colMatch[j];
            cellHit[i][j] <== mapGrid[i][j] * isTarget[i][j];
        }
    }
    
    var tempSum = 0;
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            tempSum += cellHit[i][j];
        }
    }
    
    signal wallAtDest;
    wallAtDest <== tempSum;

    wallAtDest * (1 - ramActive) === 0;
}

component main {public [oldX, oldY, newX, newY, mapHash, ramActive]} = RamMove(10, 10);