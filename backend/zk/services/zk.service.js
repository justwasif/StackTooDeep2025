import snarkjs from "snarkjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM_PATH = path.join(__dirname, "../zk/keys/ram_js/ram.wasm");
const ZKEY_PATH = path.join(__dirname, "../zk/keys/ram_final.zkey");

export const generateMoveProof = async (inputData) => {
    try {
        console.log(" ZK: Generating Proof for Move...");
        
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            inputData,
            WASM_PATH,
            ZKEY_PATH
        );

        return { proof, publicSignals };
    } catch (error) {
        console.error(" ZK Error:", error);
        throw new Error("ZK Proof Generation Failed");
    }
};