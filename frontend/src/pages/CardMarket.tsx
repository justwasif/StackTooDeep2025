"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useNavigate } from "react-router-dom";

import {
    GAME_LEDGER_ABI,
    GAME_LEDGER_ADDRESS,
} from "../constants";

export default function CardMarket() {
    const [message, setMessage] = useState<string | null>("Connecting to lobby...");
    const [loading, setLoading] = useState(true);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [gameId, setGameId] = useState<string | null>(null);
    const [playerNumber, setPlayerNumber] = useState<number | null>(null);
    const [waitingForOpponent, setWaitingForOpponent] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const navigate = useNavigate();

    // --- WebSocket & Matchmaking Logic ---
    const handlePlayGame = async () => {
        setMessage("Connecting to Card Market...");

        // const fallbackTimer = setTimeout(() => {
        //     if (!gameId) {
        //         console.warn("⚠️ Server slow/offline. Forcing Demo Mode.");
        //         setPlayerId("demo_player_1");
        //         setGameId("demo_match_" + Date.now());
        //         setPlayerNumber(1);
        //         setLoading(false);
        //         setMessage(null);
        //     }
        // }, 3000);

        try {
            const ws = new WebSocket("ws://localhost:8080/ws/game");
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("✅ WS Connected");
                ws.send(JSON.stringify({ type: "authenticate" }));
                ws.send(JSON.stringify({ type: "card-direct" }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("📨 WS Message:", data);

                if (data.type === "cardMarketReady") {
                    console.log("✅ Market Ready received!");
                    // clearTimeout(fallbackTimer);

                    setPlayerId(data.playerId);
                    setGameId(data.matchId);
                    setPlayerNumber(data.playerNumber);

                    // Store in localStorage
                    sessionStorage.setItem("playerNumber", data.playerNumber.toString());
                    sessionStorage.setItem("playerId", data.playerId);
                    sessionStorage.setItem("gameId", data.matchId);

                    setLoading(false);
                    setMessage(null);

                    // Check if waiting for opponent
                    if (data.status === "waiting_for_opponent") {
                        setWaitingForOpponent(true);
                        setMessage("Waiting for opponent to join...");
                    } else {
                        setWaitingForOpponent(false);
                    }
                }

                if (data.type === "opponentJoined") {
                    console.log("✅ Opponent joined!");
                    setWaitingForOpponent(false);
                    setMessage("Opponent found! Configure your loadout.");
                }

                if (data.type === "gameStart") {
                    console.log("🎮 Game Start received from server");

                    // store required info
                    sessionStorage.setItem("gameId", data.matchId);
                    sessionStorage.setItem("playerNumber", data.playerNumber.toString());

                    navigate(`/game?matchId=${data.matchId}`);
                }

            };

            ws.onerror = () => {
                console.error("❌ WS Error - using fallback");
            };

            ws.onclose = () => {
                console.log("🔌 WS Closed");
            };

        } catch (err) {
            console.error("❌ WS Exception:", err);
        }
    };

    useEffect(() => {
        // Check if we already have IDs (e.g. from a refresh)
        // const storedGameId = localStorage.getItem("gameId");
        // const storedPlayerId = localStorage.getItem("playerId");
        // const storedPlayerNumber = localStorage.getItem("playerNumber");
        //
        // if(storedGameId && storedPlayerId && storedPlayerNumber) {
        //     setGameId(storedGameId);
        //     setPlayerId(storedPlayerId);
        //     setPlayerNumber(parseInt(storedPlayerNumber));
        //     setLoading(false);
        // } else {
        //     handlePlayGame();
        // }

        handlePlayGame();

        // Cleanup WebSocket on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
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

            if (!isConnected) {
              return alert("Please connect your wallet first.");
            }

            const numericString = gameId?.replace(/\D/g, "");
    
              // Fallback to 0 if the string is empty or null after processing
              const cleanGameId = numericString && numericString.length > 0 
                ? BigInt(numericString) 
                : BigUint64Array; // Or 0n

              const amount = parseUnits(totalCost.toString(), 18);

              console.log(`Sending to Contract: ID=${cleanGameId}, Amount=${amount}`);

              // 2. Execute Contract Call
              // We MUST await this so navigation doesn't trigger before the wallet opens
              await writeContractAsync({
                address: "0x23D18f6fdd0cE26bCCa09E493B9326049dD83648",
                abi: GAME_LEDGER_ABI,
                functionName: "deposit"
              });

            // Close WebSocket before navigating
            wsRef.current.send(JSON.stringify({
                type: "startGame",
                matchId: gameId,
                selectedCards: selectedCards.map(c => c.id),
                txHash: null, // you can attach tx hash later
            }));

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
                <div className="flex items-center justify-center gap-4 mb-4">
          <span className="inline-block py-1 px-3 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-400">
            SESSION: {gameId}
          </span>
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400">
            PLAYER {playerNumber}
          </span>
                </div>

                {waitingForOpponent && (
                    <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                            <p className="text-yellow-400 font-mono text-sm">
                                Waiting for opponent to join...
                            </p>
                        </div>
                    </div>
                )}

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