"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { NFT_ADDRESS, NFT_ABI } from "../constants";

const DOG1_URI =
    "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

const DOG2_URI =
    "ipfs://QmNZydxUGvWBTWPvswcYSyg9HSXPoYDDDbd5E8i8N65LAp";

const DOG1_IMG =
    "https://ipfs.io/ipfs/QmSsYRx3LpDAb1GZQm7zZ1AuHZjfbPkD6J7s9r41xu1mf8?filename=pug.png";

const DOG2_IMG =
    "https://ipfs.io/ipfs/QmPwjq6xjQ4eC32hEdyuiB1Dop5fm833FQxpmUbpsZLjV2";

export default function BasicNft() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [minting, setMinting] = useState(false);

  async function mint(uri) {
    if (!isConnected) {
      alert("Connect wallet first");
      return;
    }

    try {
      setMinting(true);

      const tx = await writeContractAsync({
        address: NFT_ADDRESS,
        abi:NFT_ABI,
        functionName: "mintNft",
        args: [uri],
      });

      console.log("Mint tx:", tx);
      alert("congo");
    } catch (err) {
      console.error(err);
      alert("Mint failed");
    } finally {
      setMinting(false);
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8e692] text-[#8100c8]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* DOG 1 */}
          <div className="bg-white border-4 border-[#8100c8] rounded-xl p-6 text-center">
            <img
                src={DOG1_IMG}
                alt="Dog 1"
                className="w-64 h-64 mx-auto rounded-lg mb-4 border-4 border-[#8100c8]"
            />
            <button
                onClick={() => mint(DOG1_URI)}
                disabled={minting}
                className="px-6 py-2 bg-[#74aaee] hover:bg-[#8100c8] hover:text-[#f8e692] border-4 border-[#8100c8] rounded-lg disabled:opacity-50 text-[#8100c8] font-marker text-lg uppercase"
            >
              {minting ? "Minting..." : "Mint Dog 1"}
            </button>
          </div>

          {/* DOG 2 */}
          <div className="bg-white border-4 border-[#8100c8] rounded-xl p-6 text-center">
            <img
                src={DOG2_IMG}
                alt="Dog 2"
                className="w-64 h-64 mx-auto rounded-lg mb-4 border-4 border-[#8100c8]"
            />
            <button
                onClick={() => mint(DOG2_URI)}
                disabled={minting}
                className="px-6 py-2 bg-[#ff00d6] hover:bg-[#8100c8] hover:text-[#f8e692] border-4 border-[#8100c8] rounded-lg disabled:opacity-50 text-[#f8e692] font-marker text-lg uppercase"
            >
              {minting ? "Minting..." : "Mint Dog 2"}
            </button>
          </div>

        </div>
      </div>
  );
}