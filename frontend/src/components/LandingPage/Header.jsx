import { Link } from 'react-router-dom';
import Button from '../../ui/Button';

function Header() {
  return (
    <header className="bg-light-bg font-family-josefin ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/assets/logo.png"
              alt="SkillBridge Logo"
              className="h-10"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-black font-poppins hover:text-teal transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-black font-poppins hover:text-teal transition-colors"
            >
              How It Works
            </a>
          </nav>

          {/* Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link to="/login">
              <Button variant="secondary">
                Sign In
              </Button>
            </Link>
            <Button variant="primary">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
