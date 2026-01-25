import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#f8e692] border-b-4 border-[#8100c8]">
            {/* Logo Area */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ff00d6] border-2 border-[#8100c8] rounded-lg animate-pulse" />
                <Link to="/" className="text-2xl font-game tracking-tight text-[#8100c8] hover:text-[#ff00d6] transition-colors">
                    GHEE <span className="text-[#ff00d6]">KHATAM</span>
                </Link>
            </div>

            {/* Navigation / Actions */}
            <nav className="hidden md:flex items-center gap-8 font-marker text-sm text-[#8100c8]">
                {/* <a href="#features" className="hover:text-[#ff00d6] transition-colors">ZK-TECH</a> */}
                <Link to="login/bridge">
                    <a href="#economy" className="hover:text-[#ff00d6] transition-colors">TOKENOMICS</a>
                </Link>
                {/* <a href="#verify" className="hover:text-[#ff00d6] transition-colors">VERIFY</a> */}
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
