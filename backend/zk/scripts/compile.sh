#!/bin/bash
set -e
cd backend/zk
mkdir -p keys

CIRCOM_CMD="../../circom"
if [ ! -f "$CIRCOM_CMD" ]; then
    CIRCOM_CMD="circom"
fi

if [ ! -f "keys/pot14_final.ptau" ]; then
    echo "🎲 Generating Shared Powers of Tau..."
    snarkjs powersoftau new bn128 14 keys/pot14_0000.ptau -v
    snarkjs powersoftau contribute keys/pot14_0000.ptau keys/pot14_final.ptau --name="Auto" -v -e="random text"
    rm keys/pot14_0000.ptau
fi

for circuit_file in circuits/*.circom; do
    filename=$(basename -- "$circuit_file")
    name="${filename%.*}"
    
    echo "🚀 Building Circuit: $name..."

    $CIRCOM_CMD "$circuit_file" --r1cs --wasm --output keys -l ../../node_modules

    snarkjs groth16 setup "keys/$name.r1cs" keys/pot14_final.ptau "keys/${name}_0000.zkey"
    snarkjs zkey contribute "keys/${name}_0000.zkey" "keys/${name}_final.zkey" --name="Server" -v -e="random"
    snarkjs zkey export verificationkey "keys/${name}_final.zkey" "keys/${name}_vkey.json"

    rm "keys/${name}_0000.zkey"
done

echo "✅ ALL CIRCUITS BUILT!"