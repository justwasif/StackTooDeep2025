"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { NFT_ADDRESS, NFT_ABI,GAME_LEDGER_ABI } from "../constants";

// NFT URIs
const DOG1_URI =
  "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

const DOG2_URI =
  "ipfs://QmNZydxUGvWBTWPvswcYSyg9HSXPoYDDDbd5E8i8N65LAp";

// Preview Images
const DOG1_IMG =
  "https://ipfs.io/ipfs/QmSsYRx3LpDAb1GZQm7zZ1AuHZjfbPkD6J7s9r41xu1mf8?filename=pug.png";

const DOG2_IMG =
  "https://ipfs.io/ipfs/QmPwjq6xjQ4eC32hEdyuiB1Dop5fm833FQxpmUbpsZLjV2";

export default function BasicNft() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [minting, setMinting] = useState(false);

  // Pick random NFT
  function getRandomUri() {
    return Math.random() < 0.5 ? DOG1_URI : DOG2_URI;
  }

  // Mint random NFT
  async function mintRandom() {
    if (!isConnected) {
      alert("Connect wallet first");
      return;
    }

    const randomUri = getRandomUri();

    try {
      setMinting(true);

      const tx = await writeContractAsync({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: "mintNft",
        args: [randomUri],
      });

      console.log("Mint tx:", tx);
      alert("Random NFT minted successfully!");
    } catch (err) {
      console.error(err);
      alert("Mint failed");
    } finally {
      setMinting(false);
    }
  }

    async function withdrawPrize() {
    if (!isConnected) {
      alert("Connect wallet first");
      return;
    }

    try {
      const tx = await writeContractAsync({
        address: "0x23D18f6fdd0cE26bCCa09E493B9326049dD83648",
        abi: GAME_LEDGER_ABI,
        functionName: "withdraw",
      });

      console.log("Withdraw success:", tx);
    } catch (err) {
      console.error(err);
      alert("Withdraw failed");
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8e692] text-[#8100c8]">

      <div className="bg-white border-4 border-[#8100c8] rounded-2xl p-10 text-center space-y-8">

        <h1 className="text-3xl font-marker uppercase">
          Random NFT Mint
        </h1>

        {/* NFT previews */}
        <div className="flex gap-6 justify-center">
          

          <img
            src={DOG2_IMG}
            alt=""
            className="w-40 h-40 rounded-lg border-4 border-[#8100c8]"
          />
        </div>

        {/* Mint button */}
        <button
          onClick={mintRandom}
          disabled={minting}
          className="px-10 py-3 bg-[#ff00d6] hover:bg-[#8100c8] hover:text-[#f8e692] border-4 border-[#8100c8] rounded-xl disabled:opacity-50 text-[#f8e692] font-marker text-xl uppercase transition"
        >
          {minting ? "Minting Random..." : "Mint Random NFT"}
        </button>
        <button
        onClick={withdrawPrize}
        className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-lg"
      >
        Withdraw Prize
      </button>
              

      </div>

    </div>
  );
}
