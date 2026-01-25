import React, { useState } from 'react';
import Login from './Login';   
import Signup from './Signup'; 
import { Link } from 'react-router-dom';

const Home = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 font-sans selection:bg-green-500 selection:text-black">
      
      {/* --- HERO SECTION --- */}
      <section className="relative w-full  px-6 md:px-20 py-20 flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-green-400 mb-6">
          LIVE ON SEPOLIA TESTNET
        </span>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
          TRUST IS <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            MATHEMATICAL
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          The world's first server-authoritative <strong>Zero Knowledge</strong> strategy game. 
          We hide the map, but we prove the math. 
        </p>
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section id="features" className="px-6 md:px-12 pb-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: ZK Tech (Large) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-all group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-2xl font-bold mb-4 font-mono">/// ZK-SNARK PROOFS</h3>
            <p className="text-gray-400 mb-8 max-w-md">
              Unlike traditional games where you trust the server, Ghee Khatam generates a cryptographic proof for every move. 
              We calculate visibility and collision off-chain, then submit a <strong>Compressed Validity Proof</strong> to Ethereum.
            </p>
            <div className="flex gap-2">
              <div className="h-2 w-20 bg-green-500 rounded-full animate-pulse" />
              <div className="h-2 w-10 bg-gray-700 rounded-full" />
              <div className="h-2 w-40 bg-gray-700 rounded-full" />
            </div>
          </div>

          {/* Card 2: Economy */}
          <Link to="/login/bridge">
            <div id="economy" className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-yellow-500/50 transition-all">
              <h3 className="text-2xl font-bold mb-2 text-yellow-400">Ghee Coins</h3>
              <p className="text-sm text-gray-400 mb-6 font-mono uppercase tracking-widest">In-Game Currency</p>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span>Mint</span>
                  <span className="text-green-400">+100 GC</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span>Burn</span>
                  <span className="text-red-400">-50 GC</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 3: NFT Rewards */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/50 to-black border border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-purple-400">Winner NFT</h3>
              <p className="text-gray-400 text-sm">
                Win the match to mint a dynamic "Victor's Badge" on-chain.
              </p>
            </div>
            <div className="mt-6 w-full h-24 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30 overflow-hidden gap-2">
  
              <img 
                src="/image.png" 
                alt="Winner NFT"
                className="h-full object-contain"
              />

              <span className="font-mono text-purple-300 text-xs whitespace-nowrap">
                ERC-721 MINTAB
              </span>
            </div>
          </div>

          {/* Card 4: ZK Bundler (Tech Flex) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all flex items-center justify-between">
            <div className="max-w-md">
              <h3 className="text-2xl font-bold mb-4 font-mono">/// OPTIMISTIC ZK BUNDLING</h3>
              <p className="text-gray-400">
                To save gas, we don't publish every move. We <strong>aggregate proofs</strong> into a bundle and settle the final game state on Sepolia in a single transaction.
              </p>
            </div>
            <a 
              href="https://sepolia.etherscan.io/" 
              target="_blank" 
              className="hidden md:flex h-16 w-16 bg-blue-600 rounded-full items-center justify-center hover:scale-110 transition-transform"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

        </div>
      </section>

      {/* --- AUTH SECTION (BOTTOM) --- */}
      <section className="border-t border-white/10 bg-gray-900/50 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto py-20 px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">ENTER THE ARENA</h2>
            <p className="text-gray-400">Authenticate to generate your player identity keys.</p>
            
            {/* Toggle Switch */}
            <div className="inline-flex mt-8 bg-black p-1 rounded-lg border border-white/10">
              <button 
                onClick={() => setShowLogin(true)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${showLogin ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                LOGIN
              </button>
              <button 
                onClick={() => setShowLogin(false)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!showLogin ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                SIGN UP
              </button>
            </div>
          </div>

          {/* Render the Existing Forms */}
          <div className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden p-6 md:p-10 shadow-2xl">
            {showLogin ? <Login /> : <Signup />}
          </div>
          
        </div>
      </section>

      <footer className="py-8 text-center text-gray-600 text-sm">
        <p>BY IIT ROORKEE STUDENTS</p>
      </footer>
    </div>
  );
};

export default Home;