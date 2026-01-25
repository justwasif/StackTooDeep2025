import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import { Link } from 'react-router-dom';

const Home = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
      <div className="min-h-screen bg-[#f8e692] text-[#8100c8] pt-24 font-sans selection:bg-[#ff00d6] selection:text-[#f8e692]">

        {/* --- HERO SECTION --- */}
        <section className="relative w-full px-6 md:px-20 py-20 flex flex-col items-center text-center">

    <span className="inline-block py-1 px-3 rounded-full bg-[#74aaee] border-2 border-[#8100c8] text-sm font-marker text-[#8100c8] mb-6">
      LIVE ON SEPOLIA TESTNET
    </span>

          <h1 className="text-6xl md:text-8xl font-game tracking-tight mb-6 leading-tight text-[#8100c8]">
            TRUST IS <br/>
            <span className="text-[#ff00d6]">
        MATHEMATICAL
      </span>
          </h1>

          <p className="text-lg md:text-xl text-[#8100c8] max-w-2xl mb-10 leading-relaxed">
            The world's first server-authoritative <strong>Zero Knowledge</strong> strategy game.
            We hide the map, but we prove the math.
          </p>
        </section>

        {/* --- BENTO GRID FEATURES --- */}
        <section id="features" className="px-6 md:px-12 pb-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: ZK Tech (Large) */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white border-4 border-[#8100c8] hover:border-[#ff00d6] transition-all group overflow-hidden relative">
              <h3 className="text-3xl font-game mb-4 text-[#8100c8]">ZK-SNARK PROOFS</h3>
              <p className="text-[#8100c8] mb-8 max-w-md text-base">
                Unlike traditional games where you trust the server, Ghee Khatam generates a cryptographic proof for every move.
                We calculate visibility and collision off-chain, then submit a <strong>Compressed Validity Proof</strong> to Ethereum.
              </p>
              <div className="flex gap-2">
                <div className="h-2 w-20 bg-[#ff00d6] rounded-full animate-pulse" />
                <div className="h-2 w-10 bg-[#74aaee] rounded-full" />
                <div className="h-2 w-40 bg-[#8100c8] rounded-full" />
              </div>
            </div>

            {/* Card 2: Economy */}
            <Link to="/login/bridge">
              <div id="economy" className="p-8 rounded-3xl bg-white border-4 border-[#8100c8] hover:border-[#74aaee] transition-all">
                <h3 className="text-3xl font-game mb-2 text-[#ff00d6]">Ghee Coins</h3>
                <p className="text-sm text-[#8100c8] mb-6 font-marker uppercase tracking-wide">In-Game Currency</p>
                <div className="space-y-3">
                  <div className="flex justify-between border-b-2 border-[#8100c8] pb-2">
                    <span className="text-[#8100c8]">Mint</span>
                    <span className="text-[#ff00d6] font-marker">+100 GC</span>
                  </div>
                  <div className="flex justify-between border-b-2 border-[#8100c8] pb-2">
                    <span className="text-[#8100c8]">Burn</span>
                    <span className="text-[#74aaee] font-marker">-50 GC</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 3: NFT Rewards */}
            <Link to="/nftMint">
              <div className="p-8 rounded-3xl bg-[#8100c8] border-4 border-[#8100c8] flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl font-game mb-2 text-[#f8e692]">Winner NFT</h3>
                  <p className="text-[#f8e692] text-base">
                    Win the match to mint a dynamic "Victor's Badge" on-chain.
                  </p>
                </div>
                <div className="mt-6 w-full h-24 bg-[#ff00d6] rounded-xl flex items-center justify-center border-4 border-[#f8e692]">
                  <span className="font-marker text-[#f8e692] text-sm">ERC-721 MINTABLE</span>
                </div>
              </div>
            </Link>

            {/* Card 4: ZK Bundler (Tech Flex) */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white border-4 border-[#8100c8] hover:border-[#74aaee] transition-all flex items-center justify-between">
              <div className="max-w-md">
                <h3 className="text-3xl font-game mb-4 text-[#8100c8]">OPTIMISTIC ZK BUNDLING</h3>
                <p className="text-[#8100c8] text-base">
                  To save gas, we don't publish every move. We <strong>aggregate proofs</strong> into a bundle and settle the final game state on Sepolia in a single transaction.
                </p>
              </div>
              <a
                  href="https://sepolia.etherscan.io/"
                  target="_blank"
                  className="hidden md:flex h-16 w-16 bg-[#74aaee] border-4 border-[#8100c8] rounded-full items-center justify-center hover:scale-110 transition-transform"
              >
                <svg className="w-8 h-8 text-[#8100c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

          </div>
        </section>

        {/* --- AUTH SECTION (BOTTOM) --- */}
        <section className="border-t-4 border-[#8100c8] bg-white">
          <div className="max-w-4xl mx-auto py-20 px-6">
            <div className="text-center mb-10">
              <h2 className="text-5xl font-game mb-4 text-[#8100c8]">ENTER THE ARENA</h2>
              <p className="text-[#8100c8] text-lg">Authenticate to generate your player identity keys.</p>

              {/* Toggle Switch */}
              <div className="inline-flex mt-8 bg-[#f8e692] p-1 rounded-lg border-4 border-[#8100c8]">
                <button
                    onClick={() => setShowLogin(true)}
                    className={`px-6 py-2 rounded-md text-base font-marker transition-all ${showLogin ? 'bg-[#8100c8] text-[#f8e692] shadow-lg' : 'text-[#8100c8] hover:text-[#ff00d6]'}`}
                >
                  LOGIN
                </button>
                <button
                    onClick={() => setShowLogin(false)}
                    className={`px-6 py-2 rounded-md text-base font-marker transition-all ${!showLogin ? 'bg-[#8100c8] text-[#f8e692] shadow-lg' : 'text-[#8100c8] hover:text-[#ff00d6]'}`}
                >
                  SIGN UP
                </button>
              </div>
            </div>

            {/* Render the Existing Forms */}
            <div className="bg-[#f8e692] border-4 border-[#8100c8] rounded-3xl overflow-hidden p-6 md:p-10 shadow-2xl">
              {showLogin ? <Login /> : <Signup />}
            </div>

          </div>
        </section>

        <footer className="py-8 text-center text-[#8100c8] text-sm">
          <p></p>
        </footer>
      </div>  );
};

export default Home;