"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { NFT_ADDRESS, NFT_ABI ,GAME_LEDGER_ABI} from "../constants";


const DOG1_URI =
  "ipfs://Qmdk2b6VUemWYkfcfSVvGxBkRG5GBcxwkWrZeTomRzNTAD";

const DOG2_URI =
  "ipfs://QmNZydxUGvWBTWPvswcYSyg9HSXPoYDDDbd5E8i8N65LAp";

const DOG1_IMG =
  "https://ipfs.io/ipfs/QmZ6ZJJ3iegQ6CUwnmocCVribFvEChRQNomdsaftHCJkA6";

const DOG2_IMG =
  "https://ipfs.io/ipfs/QmPwjq6xjQ4eC32hEdyuiB1Dop5fm833FQxpmUbpsZLjV2";

export default function BasicNft() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [minting, setMinting] = useState(false);
  const [lastDogImg, setLastDogImg] = useState(null);

  function getRandomDog() {
    const rand = Math.random() < 0.5;
    return rand
      ? { uri: DOG1_URI, img: DOG1_IMG, name: "modiji" }
      : { uri: DOG2_URI, img: DOG2_IMG, name: "cat" };
  }

  async function mintRandom() {
    if (!isConnected) {
      alert("Connect wallet first");
      return;
    }

    const dog = getRandomDog();

    try {
      setMinting(true);
      setLastDogImg(dog.img);

      const tx = await writeContractAsync({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: "mintNft",
        args: [dog.uri],
      });

      console.log(`Minted ${dog.name}`, tx);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-xl p-10 text-center space-y-6">
        <div className="mx-auto">
            <img src="Pasted image.png" width={300} height={100}/>
        </div>
        <button
          onClick={mintRandom}
          disabled={minting}
          className="px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-lg disabled:opacity-50"
        >
          {minting ? "Minting Random winning reward ..." : "Mint Random winning reward "}
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
