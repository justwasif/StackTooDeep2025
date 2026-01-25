import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-11/12 max-w-7xl z-50 flex items-center justify-between px-8 py-4 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl">
      {/* Logo Area */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-600 rounded-lg animate-pulse" />
        <Link to="/" className="text-2xl font-black tracking-tighter text-white hover:text-green-400 transition-colors">
          GHEE <span className="text-green-400">KHATAM</span>
        </Link>
      </div>

      {/* Navigation / Actions */}

      <nav className="hidden md:flex items-center gap-8 font-mono text-sm text-gray-400">
        <a href="#features" className="hover:text-white transition-colors">ZK-TECH</a>
        <Link to="/login/bridge">

          <a href="#economy" className="hover:text-white transition-colors">TOKENOMICS</a>
        </Link>
        <a href="#verify" className="hover:text-white transition-colors">VERIFY</a>
      </nav>

      {/* Wallet Connect */}
      <div className="flex items-center gap-4">
        <ConnectButton 
          accountStatus="address" 
          chainStatus="icon" 
          showBalance={false}
        />
      </div>
    </header>
  );
};

export default Header;