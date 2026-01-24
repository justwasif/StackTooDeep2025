"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useNavigate, useLocation } from "react-router-dom";

import {
  GAME_LEDGER_ABI,
  GAME_LEDGER_ADDRESS,
} from "../constants";

export default function CardMarket() {
  const [message, setMessage] = useState<string | null>("Connecting to lobby...");
  const [loading, setLoading] = useState(true); // Start true
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  const navigate = useNavigate();

  // --- WebSocket & Matchmaking Logic ---
  const handlePlayGame = async () => {
    setMessage("Connecting to Card Market...");
    
    const fallbackTimer = setTimeout(() => {
        if (!gameId) {
            console.warn("⚠️ Server slow/offline. Forcing Demo Mode.");
            setPlayerId("demo_player_1");
            setGameId("demo_match_" + Date.now());
            setLoading(false);
            setMessage(null);
        }
    }, 3000);

    try {
      const ws = new WebSocket("ws://localhost:8080/ws/game");

      ws.onopen = () => {
        console.log("✅ WS Connected");
        ws.send(JSON.stringify({ type: "authenticate" }));
        // Request the market session
        ws.send(JSON.stringify({ type: "cardMarket" }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📨 WS Message:", data);

        if (data.type === "cardMarketReady") {
          console.log("✅ Market Ready received!");
          clearTimeout(fallbackTimer); // Cancel fallback
          setPlayerId(data.playerId);
          setGameId(data.matchId);
          localStorage.setItem("playerNumber", data.playerNumber);
          setLoading(false);
          setMessage(null);
          ws.close();
        }
      };

      ws.onerror = () => {
        console.error("❌ WS Error - using fallback");
      };

    } catch (err) {
      console.error("❌ WS Exception:", err);
    }
  };

  useEffect(() => {
    // Check if we already have IDs (e.g. from a refresh)
    const storedGameId = localStorage.getItem("gameId");
    const storedPlayerId = localStorage.getItem("playerId");
    
    if(storedGameId && storedPlayerId) {
        setGameId(storedGameId);
        setPlayerId(storedPlayerId);
        setLoading(false);
    } else {
        // Otherwise try to fetch them
        handlePlayGame();
    }
  }, []);

  // --- Card Data ---
  const CARDS = [
    { id: 1, name: "Ram Break", price: 10, description: "Bypass one wall instantly.", image: "../assets/UI/image 2.png" },
    { id: 2, name: "Sonar-Ping", price: 8, description: "Reveal 3 random tiles.", image: "../assets/UI/image 4.png" },
    { id: 3, name: "Block-Cage", price: 12, description: "Build a wall around the enemy", image: "../assets/UI/image 3.png" },
    { id: 4, name: "Skip-Turn", price: 6, description: "Skip 1 turn of the opponent", image: "../assets/UI/image 1.png" },
    { id: 5, name: "Ink-Blast", price: 12, description: "Reduce visibility of Opponent", image: "../assets/UI/image 5.png" },
  ];

  const { isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  
  const [selectedCards, setSelectedCards] = useState<any[]>([]);

  const toggleCard = (card: any) => {
    setSelectedCards((prev) =>
      prev.some((c) => c.id === card.id)
        ? prev.filter((c) => c.id !== card.id)
        : [...prev, card]
    );
  };

  const totalCost = useMemo(
    () => selectedCards.reduce((sum, c) => sum + c.price, 0),
    [selectedCards]
  );

  const handleBuy = async () => {
    try {

      if (selectedCards.length === 0) return alert("Select at least one card.");

      const amount = parseUnits(totalCost.toString(), 18);

      console.log(`Processing buy for Game: ${gameId}`);

      // Attempt On-Chain Deposit
      if (isConnected) {
          try {
            await writeContractAsync({
                address: GAME_LEDGER_ADDRESS,
                abi: GAME_LEDGER_ABI,
                functionName: "deposit",
                args: [BigInt(gameId || 0), amount],
            });
          } catch(e) {
              console.warn("Contract write failed/cancelled, continuing anyway for demo:", e);
          }
      }

      navigate(`/game?matchId=${gameId}`);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Transaction failed");
    }
  };

  // --- LOADING STATE ---
  if (loading && !gameId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="w-24 h-24 rounded-full border-t-4 border-b-4 border-green-500 animate-spin mb-8"></div>
        <h2 className="text-2xl font-bold font-mono text-green-400 animate-pulse">
          INITIALIZING MARKET...
        </h2>
        <p className="mt-4 text-gray-500 font-mono">
            {message || "Handshaking..."}
        </p>
      </div>
    );
  }

  // --- MAIN MARKET UI ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 font-sans">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <span className="inline-block py-1 px-3 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-400 mb-4">
          SESSION ID: {gameId}
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
          LOADOUT <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">CONFIGURATION</span>
        </h1>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDS.map((card) => {
            const selected = selectedCards.some((c) => c.id === card.id);
            return (
              <div
                key={card.id}
                onClick={() => toggleCard(card)}
                className={`relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer p-6
                  ${selected 
                    ? "border-green-500 bg-green-900/10 scale-[1.02]" 
                    : "border-white/10 bg-white/5 hover:border-green-500/50"
                  }
                `}
              >
                <div className="aspect-square bg-black/40 mb-4 rounded-xl overflow-hidden flex items-center justify-center">
                    <img src={card.image} alt={card.name} className="h-full object-cover" />
                </div>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold font-mono">{card.name}</h2>
                    <span className="font-mono text-green-400">{card.price} GC</span>
                </div>
                <p className="text-sm text-gray-400">{card.description}</p>
                {selected && <div className="absolute top-4 right-4 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded">EQUIPPED</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/10 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-xl font-bold">Total: {totalCost} <span className="text-green-500">GC</span></div>
            <button
                onClick={handleBuy}
                disabled={selectedCards.length === 0}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-black font-bold rounded-xl disabled:opacity-50"
            > 
                {isPending ? "CONFIRMING..." : "CONFIRM LOADOUT TO GAME"}
            </button>
        </div>
      </div>

    </div>
  );
}