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

                    setPlayerId(data.playerId);
                    setGameId(data.matchId);
                    setPlayerNumber(data.playerNumber);

                    sessionStorage.setItem("playerNumber", data.playerNumber.toString());
                    sessionStorage.setItem("playerId", data.playerId);
                    sessionStorage.setItem("gameId", data.matchId);

                    setLoading(false);
                    setMessage(null);

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
        handlePlayGame();

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
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8e692] text-[#8100c8]">
                <div className="w-24 h-24 rounded-full border-t-4 border-b-4 border-[#ff00d6] animate-spin mb-8"></div>
                <h2 className="text-3xl font-game text-[#8100c8] animate-pulse">
                    INITIALIZING MARKET...
                </h2>
                <p className="mt-4 text-[#8100c8] font-marker text-lg">
                    {message || "Handshaking..."}
                </p>
            </div>
        );
    }

    // --- MAIN MARKET UI ---
    return (
        <div className="min-h-screen bg-[#f8e692] text-[#8100c8] pt-24 pb-32 font-marker">

            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
          <span className="inline-block py-1 px-3 rounded-full bg-[#ff00d6] border-2 border-[#8100c8] text-sm font-marker text-[#8100c8]">
            SESSION: {gameId}
          </span>
                    <span className="inline-block py-1 px-3 rounded-full bg-[#74aaee] border-2 border-[#8100c8] text-sm font-marker text-[#8100c8]">
            PLAYER {playerNumber}
          </span>
                </div>

                {waitingForOpponent && (
                    <div className="mb-4 p-4 rounded-xl bg-[#f8e692] border-4 border-[#8100c8]">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-[#ff00d6] animate-pulse"></div>
                            <p className="text-[#8100c8] font-marker text-base">
                                Waiting for opponent to join...
                            </p>
                        </div>
                    </div>
                )}

                <h1 className="text-5xl md:text-7xl font-game tracking-tight mb-4 text-[#8100c8]">
                    LOADOUT <span className="text-[#ff00d6]">CONFIGURATION</span>
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
                                className={`relative overflow-hidden rounded-3xl border-4 transition-all duration-300 cursor-pointer p-6
                  ${selected
                                    ? "border-[#ff00d6] bg-[#74aaee] scale-[1.02]"
                                    : "border-[#8100c8] bg-white hover:border-[#ff00d6]"
                                }
                `}
                            >
                                <div className="aspect-square bg-[#f8e692] mb-4 rounded-xl overflow-hidden flex items-center justify-center border-2 border-[#8100c8]">
                                    <img src={card.image} alt={card.name} className="h-full object-cover" />
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-xl font-game text-[#8100c8]">{card.name}</h2>
                                    <span className="font-marker text-[#ff00d6] text-lg">{card.price} GC</span>
                                </div>
                                <p className="text-sm text-[#8100c8]">{card.description}</p>
                                {selected && <div className="absolute top-4 right-4 bg-[#ff00d6] text-[#f8e692] text-xs font-marker px-2 py-1 rounded border-2 border-[#8100c8]">EQUIPPED</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#f8e692] border-t-4 border-[#8100c8] z-40">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="text-2xl font-game text-[#8100c8]">Total: {totalCost} <span className="text-[#ff00d6]">GC</span></div>
                    <button
                        onClick={handleBuy}
                        disabled={selectedCards.length === 0}
                        className="px-8 py-4 bg-[#ff00d6] hover:bg-[#8100c8] text-[#f8e692] border-4 border-[#8100c8] font-marker text-lg tracking-wide rounded-xl disabled:opacity-50 uppercase"
                    >
                        {isPending ? "CONFIRMING..." : "CONFIRM LOADOUT TO GAME"}
                    </button>
                </div>
            </div>

        </div>
    );
}
