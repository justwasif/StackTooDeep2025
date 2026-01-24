import * as snarkjs from "snarkjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// 1. Setup Paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM_PATH = path.join(__dirname, "../zk/keys/ram_js/ram.wasm");
const ZKEY_PATH = path.join(__dirname, "../zk/keys/ram_final.zkey");
// Note: We only load the vKey if we need to verify internally, 
// but for generating proofs, we technically only need the first two.
// If you don't have verification_key.json in keys/, remove the next two lines.
const VKEY_PATH = path.join(__dirname, "../zk/keys/verification_key.json");

// 2. EXPORT THE FUNCTION (This is what was missing/broken)
export const generateMoveProof = async (inputData) => {
    try {
        console.log("🔐 ZK SERVICE: Generating Proof...");
        
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            inputData,
            WASM_PATH,
            ZKEY_PATH
        );

        console.log("✅ ZK SERVICE: Proof Generated!");
        return { proof, publicSignals };

    } catch (error) {
        console.error("❌ ZK SERVICE FAILED:", error);
        throw new Error("ZK Proof Generation Failed: " + error.message);
    }
};