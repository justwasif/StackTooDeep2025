import { ethers } from 'ethers';

const generateMockBundle = () => {
    const cards = ["RAM_BREAK", "SONAR_PING", "SHIELD_UP", "TELEPORT", "EMP_BLAST"];
    const bundle = [];

    // Generate 5-8 random moves
    const moveCount = 5 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < moveCount; i++) {
        const card = cards[Math.floor(Math.random() * cards.length)];
        bundle.push({
            step: i,
            card: card,
            // Hardcoded "ZK Inputs" to look technical
            inputs: [
                "0x" + Math.random().toString(16).substr(2, 64), // Public Signal A
                "0x" + Math.random().toString(16).substr(2, 64), // Public Signal B
                Math.floor(Math.random() * 100) // Grid Index
            ]
        });
    }
    return bundle;
};

const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE"; 
const ABI = [
    "function verifyGameBatch(uint256 matchId, bytes32 bundleHash, bytes memory mockProof, address winner) public"
];

export const submitMatchToChain = async (matchIdString, winnerAddress) => {
    try {
        if (!window.ethereum) throw new Error("No Wallet Found");


        const bundle = generateMockBundle();
        console.log(" ZK Bundle Constructed:", bundle);

        const bundleString = JSON.stringify(bundle);
        const bundleHash = ethers.id(bundleString); // SHA-256 equivalent
        
        // C. Numeric Match ID (Hash the string ID to get a number)
        // Convert string matchId (e.g. "match_123") to a BigInt for Solidity uint256
        const matchIdBigInt = BigInt(ethers.id(matchIdString));

        // D. Connect to Wallet
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        console.log(`⛓️ Submitting to Sepolia...`);
        console.log(`   Match: ${matchIdBigInt}`);
        console.log(`   Root: ${bundleHash}`);

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