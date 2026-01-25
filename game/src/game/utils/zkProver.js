import { ethers } from 'ethers';

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; 
const ABI = [
    "function verifyGameBatch(uint256 matchId, bytes32 bundleHash, bytes memory mockProof, address winner) public"
];

// --- 1. MOCK PROOF GENERATOR (Renamed to match your import) ---
export const generateMoveProof = async (cardId) => {
    // Simulate a computational delay (like a real ZK proof)
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
        step: Date.now(),
        cardId: cardId,
        proof: "0x" + Math.random().toString(16).substr(2, 64),
        inputs: [
            "0x" + Math.random().toString(16).substr(2, 64),
            Math.floor(Math.random() * 100)
        ]
    };
};

// --- 2. BUNDLE GENERATOR ---
export const generateMockBundle = () => {
    const cards = ["RAM_BREAK", "SONAR_PING", "SHIELD_UP", "TELEPORT", "EMP_BLAST"];
    const bundle = [];
    const moveCount = 5 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < moveCount; i++) {
        bundle.push({
            step: i,
            card: cards[Math.floor(Math.random() * cards.length)],
            proof: "0x" + Math.random().toString(16).substr(2, 64)
        });
    }
    return bundle;
};

// --- 3. ON-CHAIN SUBMISSION ---
export const submitMatchToChain = async (matchIdString, winnerAddress) => {
    try {
        if (!window.ethereum) throw new Error("No Wallet Found");

        const bundle = generateMockBundle();
        const bundleString = JSON.stringify(bundle);
        const bundleHash = ethers.id(bundleString); 
        const matchIdBigInt = BigInt(ethers.id(matchIdString));

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        console.log(`⛓️ Submitting Proof Bundle to Sepolia...`);

        const tx = await contract.verifyGameBatch(
            matchIdBigInt, 
            bundleHash, 
            "0x1234567890abcdef", 
            winnerAddress || await signer.getAddress()
        );

        console.log("⏳ Transaction sent:", tx.hash);
        return { success: true, hash: tx.hash, bundle: bundle };

    } catch (error) {
        console.error("Blockchain Error:", error);
        return { success: false, error: error.message };
    }
};