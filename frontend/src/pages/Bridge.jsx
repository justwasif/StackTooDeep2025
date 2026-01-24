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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4">
        <div className="w-16 h-16 mb-6 rounded-full border-2 border-dashed border-gray-600 animate-spin-slow"></div>
        <h2 className="text-2xl font-bold font-mono tracking-widest text-gray-500">
          WALLET NOT DETECTED
        </h2>
        <p className="mt-2 text-gray-600">Please connect your wallet to access the bridge.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 font-sans selection:bg-green-500 selection:text-black flex flex-col items-center">
      
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400 mb-4">
          LAYER 1 {'<->'} LAYER 2
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
          TOKEN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-500">BRIDGE</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto text-sm">
          Swap ETH for Ghee Khatam Coins (GKH) to participate in the ZK Arena.
        </p>
      </div>

      {/* Main Bridge Card */}
      <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10 bg-black/20">
          <div className="p-6 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-mono mb-1">Your Balance</p>
            <p className="text-xl font-bold text-green-400 font-mono">
              {tokenBalance ? Number(formatEther(tokenBalance)).toFixed(2) : "0.00"} <span className="text-xs text-gray-400">GKH</span>
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-mono mb-1">Pool Liquidity</p>
            <p className="text-xl font-bold text-blue-400 font-mono">
              {contractEthBalance ? Number(formatEther(contractEthBalance)).toFixed(4) : "0.0000"} <span className="text-xs text-gray-400">ETH</span>
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Section 1: Deposit */}
          <div className="space-y-3 relative group">
            <div className="absolute -left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="text-green-500">⬇</span> MINT GKH
            </h2>
            <div className="relative">
              <input
                type="number"
                placeholder="0.0 ETH"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pr-16 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">ETH</span>
            </div>
            <button
              onClick={handleDeposit}
              disabled={isPending || !ethAmount}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:shadow-none"
            >
              {isPending ? "CONFIRMING..." : "DEPOSIT & MINT"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-gray-600 font-mono">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {/* Section 2: Burn */}
          <div className="space-y-3 relative group">
            <div className="absolute -left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="text-red-500">⬆</span> WITHDRAW ETH
            </h2>
            <div className="relative">
              <input
                type="number"
                placeholder="0 GKH"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pr-16 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">GKH</span>
            </div>
            <button
              onClick={handleBurn}
              disabled={isPending || !tokenAmount}
              className="w-full py-3 bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {isPending ? "BURNING..." : "BURN & WITHDRAW"}
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Footer - NOW BRIGHTER! */}
      <button 
        onClick={() => navigate("/card-direct")} 
        className="mt-8 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all flex items-center gap-3 group"
      >
        <span>CONTINUE TO IN-GAME MARKETPLACE</span>
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </button>

    </div>
  );
}