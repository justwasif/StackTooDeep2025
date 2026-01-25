import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import config from "./component/walletButton.js";

// Page Imports
import Home from './pages/Home.jsx';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Game from './pages/Game';
import Bridge from './pages/Bridge.jsx';
import Header from './component/Header';
import CardMarket from './pages/CardMarket';
import Nft_mint from './pages/Nft_mint.jsx';
import Looser from "./pages/Looser.jsx";

import './App.css';
import '@rainbow-me/rainbowkit/styles.css';

// 1. Initialize Client OUTSIDE the component
const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {/* 2. BrowserRouter wraps everything */}
          <BrowserRouter>
            
            {/* 3. Header inside Router */}
            <Header /> 
            
            <Routes>
              {/* Main Landing Page */}
              <Route path="/" element={<Home />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Game Routes */}
              <Route path="/login/bridge" element={<Bridge/>}/> 
              <Route path="/login/bridge/dashboard" element={<Dashboard />} />
              
              <Route path="/card-direct" element={<CardMarket />} />
              
              <Route path="/game" element={<Game />} />
              <Route path='/nftMint' element={<Nft_mint/>}/>
              <Route path='/looser' element={<Looser/>}/>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>

          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;