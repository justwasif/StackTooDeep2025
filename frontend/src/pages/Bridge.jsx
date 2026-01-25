"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther, parseUnits } from "viem";
import { Link, useNavigate } from "react-router-dom";

import { TSC_CONTRACT_ABI, TSC_CONTRACT_ADDRESS } from "../constants";

export default function Bridge() {
  const { address, isConnected } = useAccount();

  const [ethAmount, setEthAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");

  const { writeContract, isPending } = useWriteContract();
  const navigate = useNavigate();

  /* ---------------- READS ---------------- */

  const { data: tokenBalance } = useReadContract({
    abi: TSC_CONTRACT_ABI,
    address: TSC_CONTRACT_ADDRESS,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      watch: true,
    },
  });

  const { data: contractEthBalance } = useReadContract({
    abi: TSC_CONTRACT_ABI,
    address: TSC_CONTRACT_ADDRESS,
    functionName: "getContractEthBalance",
    query: { watch: true },
  });

  /* ---------------- WRITES ---------------- */

  const handleDeposit = async () => {
    if (!ethAmount) return;

    writeContract({
      abi: TSC_CONTRACT_ABI,
      address: TSC_CONTRACT_ADDRESS,
      functionName: "deposit",
      value: parseEther(ethAmount),
    });
  };

  const handleBurn = async () => {
    if (!tokenAmount) return;

    const amountInWei = parseUnits(tokenAmount, 18);

    writeContract({
      abi: TSC_CONTRACT_ABI,
      address: TSC_CONTRACT_ADDRESS,
      functionName: "burnTokens",
      args: [amountInWei],
    });
  };

  /* ---------------- UI ---------------- */

  if (!isConnected) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8e692] text-[#8100c8] p-4">
          <div className="w-16 h-16 mb-6 rounded-full border-2 border-dashed border-[#8100c8] animate-spin-slow"></div>
          <h2 className="text-2xl font-game tracking-tight text-[#8100c8]">
            WALLET NOT DETECTED
          </h2>
          <p className="mt-2 text-[#8100c8] font-marker">Please connect your wallet to access the bridge.</p>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-[#f8e692] text-[#8100c8] pt-24 pb-12 px-4 font-marker selection:bg-[#ff00d6] selection:text-[#f8e692] flex flex-col items-center">

        {/* Header */}
        <div className="text-center mb-10">
        <span className="inline-block py-1 px-3 rounded-full bg-[#74aaee] border-2 border-[#8100c8] text-sm font-marker text-[#8100c8] mb-4">
          LAYER 1 ↔ LAYER 2
        </span>
          <h1 className="text-5xl md:text-6xl font-game tracking-tight mb-2 text-[#8100c8]">
            TOKEN <span className="text-[#ff00d6]">BRIDGE</span>
          </h1>
          <p className="text-[#8100c8] max-w-lg mx-auto text-base">
            Swap ETH for Ghee Khatam Coins (GKH) to participate in the ZK Arena.
          </p>
        </div>

        {/* Main Bridge Card */}
        <div className="w-full max-w-lg bg-white border-4 border-[#8100c8] rounded-3xl shadow-2xl overflow-hidden">

          {/* Stats Row */}
          <div className="grid grid-cols-2 divide-x-4 divide-[#8100c8] border-b-4 border-[#8100c8] bg-[#74aaee]">
            <div className="p-6 text-center">
              <p className="text-xs text-[#8100c8] uppercase tracking-wide font-marker mb-1">Your Balance</p>
              <p className="text-2xl font-bold text-[#8100c8] font-game">
                {tokenBalance ? Number(formatEther(tokenBalance)).toFixed(2) : "0.00"} <span className="text-sm text-[#8100c8]">GKH</span>
              </p>
            </div>
            <div className="p-6 text-center">
              <p className="text-xs text-[#8100c8] uppercase tracking-wide font-marker mb-1">Pool Liquidity</p>
              <p className="text-2xl font-bold text-[#8100c8] font-game">
                {contractEthBalance ? Number(formatEther(contractEthBalance)).toFixed(4) : "0.0000"} <span className="text-sm text-[#8100c8]">ETH</span>
              </p>
            </div>
          </div>

          <div className="p-8 space-y-8">

            {/* Section 1: Deposit */}
            <div className="space-y-3 relative group">
              <div className="absolute -left-8 top-0 bottom-0 w-1 bg-[#ff00d6] opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <h2 className="font-game text-2xl flex items-center gap-2 text-[#8100c8]">
                <span className="text-[#ff00d6]">⬇</span> MINT GKH
              </h2>
              <div className="relative">
                <input
                    type="number"
                    placeholder="0.0 ETH"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    className="w-full bg-[#f8e692] border-2 border-[#8100c8] rounded-xl p-4 pr-16 text-[#8100c8] placeholder-[#8100c8] focus:outline-none focus:border-[#ff00d6] transition-colors font-marker text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8100c8] text-sm font-bold">ETH</span>
              </div>
              <button
                  onClick={handleDeposit}
                  disabled={isPending || !ethAmount}
                  className="w-full py-4 bg-[#ff00d6] hover:bg-[#8100c8] text-[#f8e692] border-4 border-[#8100c8] font-marker text-xl tracking-wide rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none uppercase"
              >
                {isPending ? "CONFIRMING..." : "DEPOSIT & MINT"}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-1 bg-[#8100c8] flex-1"></div>
              <span className="text-sm text-[#8100c8] font-marker">OR</span>
              <div className="h-1 bg-[#8100c8] flex-1"></div>
            </div>

            {/* Section 2: Burn */}
            <div className="space-y-3 relative group">
              <div className="absolute -left-8 top-0 bottom-0 w-1 bg-[#74aaee] opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <h2 className="font-game text-2xl flex items-center gap-2 text-[#8100c8]">
                <span className="text-[#74aaee]">⬆</span> WITHDRAW ETH
              </h2>
              <div className="relative">
                <input
                    type="number"
                    placeholder="0 GKH"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    className="w-full bg-[#f8e692] border-2 border-[#8100c8] rounded-xl p-4 pr-16 text-[#8100c8] placeholder-[#8100c8] focus:outline-none focus:border-[#74aaee] transition-colors font-marker text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8100c8] text-sm font-bold">GKH</span>
              </div>
              <button
                  onClick={handleBurn}
                  disabled={isPending || !tokenAmount}
                  className="w-full py-4 bg-[#74aaee] border-4 border-[#8100c8] text-[#8100c8] hover:bg-[#8100c8] hover:text-[#f8e692] font-marker text-xl tracking-wide rounded-xl transition-all disabled:opacity-50 uppercase"
              >
                {isPending ? "BURNING..." : "BURN & WITHDRAW"}
              </button>
            </div>

          </div>
        </div>

        {/* Navigation Footer */}
        <button
            onClick={() => navigate("/card-direct")}
            className="mt-8 px-10 py-5 bg-[#8100c8] hover:bg-[#ff00d6] text-[#f8e692] border-4 border-[#8100c8] font-marker text-lg tracking-wide rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group uppercase"
        >
          <span>CONTINUE TO IN-GAME MARKETPLACE</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>

      </div>
  );
}
