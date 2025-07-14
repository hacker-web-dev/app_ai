import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, LogIn, Search, ChevronDown, Moon, Sun } from 'lucide-react';
import { useAuth } from '../authcontext';
import { logoutUser } from '../authservice';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.mobile-menu-container')) {
        setIsOpen(false);
      }
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, userMenuOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white dark:bg-gray-900 shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <div 
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              scrolled 
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' 
                : 'bg-white/20 text-white'
            } transition-all duration-300`}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-6 h-6"
            >
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
              <path d="M12 12L2 12"></path>
              <path d="M12 12l4.6 4.6"></path>
              <path d="M12 12l4.6-4.6"></path>
            </svg>
          </div>
          <span className={`ml-3 text-2xl font-bold tracking-tight ${
            scrolled 
              ? 'text-indigo-600 dark:text-indigo-300' 
              : 'text-white'
          } transition-all duration-300`}>
            PriceAI
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          <NavLink href="/" label="Home" scrolled={scrolled} />
          <NavLink href="/#features" label="Features" scrolled={scrolled} />
          <NavLink href="/#how-it-works" label="How It Works" scrolled={scrolled} />
          <NavLink href="/search" label="Compare Prices" scrolled={scrolled} icon={<Search size={16} />} />
          
          {/* Dark Mode Toggle */}
          <button
            onClick={() => {
              console.log('Dark mode toggle clicked, current state:', isDarkMode);
              toggleDarkMode();
            }}
            className={`p-2 rounded-md transition-colors ml-2 ${
              scrolled 
                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' 
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle dark mode"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Auth Buttons / User Menu */}
          {currentUser ? (
            <div className="relative user-menu-container ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center ml-4 px-3 py-2 rounded-lg transition-colors ${
                  scrolled 
                    ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200' 
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <span className="mr-2 font-medium">{currentUser.displayName || 'User'}</span>
                <ChevronDown size={16} />
              </button>
              
              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                  <Link 
                    to="/search"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <User size={16} className="mr-2" />
                    Search Prices
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center ml-2">
              <Link 
                to="/login" 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  scrolled 
                    ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className={`ml-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  scrolled 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600' 
                    : 'bg-white text-indigo-600 hover:bg-gray-100'
                }`}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Mobile Dark Mode Toggle */}
          <button
            onClick={() => {
              console.log('Mobile dark mode toggle clicked, current state:', isDarkMode);
              toggleDarkMode();
            }}
            className={`p-2 rounded-md transition-colors ${
              scrolled 
                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' 
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle dark mode"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              scrolled ? 'text-gray-800 dark:text-gray-200' : 'text-white'
            }`}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={`md:hidden mobile-menu-container absolute top-full left-0 right-0 transition-all duration-300 ease-in-out transform ${
          isOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-4 opacity-0 invisible'
        }`}
      >
        <div className="bg-white dark:bg-gray-800 shadow-lg divide-y divide-gray-100 dark:divide-gray-700">
          <div className="py-2 px-4">
            <NavMobileLink href="/" label="Home" />
            <NavMobileLink href="/#features" label="Features" />
            <NavMobileLink href="/#how-it-works" label="How It Works" />
            <NavMobileLink href="/search" label="Compare Prices" icon={<Search size={16} />} />
          </div>
          
          {/* Auth Section */}
          <div className="py-4 px-4">
            {currentUser ? (
              <>
                <div className="flex items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                  </div>
                </div>
                <Link 
                  to="/search" 
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                >
                  <User size={16} className="mr-2" />
                  Search Prices
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md mt-2"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link 
                  to="/login" 
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                >
                  <User size={16} className="mr-2" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Desktop Navigation Link
const NavLink = ({ href, label, icon, scrolled }) => (
  <Link 
    to={href} 
    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
      scrolled 
        ? 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800' 
        : 'text-white hover:bg-white/10'
    }`}
  >
    {icon && <span className="mr-1.5">{icon}</span>}
    {label}
  </Link>
);

// Mobile Navigation Link
const NavMobileLink = ({ href, label, icon }) => (
  <Link 
    to={href} 
    className="flex items-center py-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
  >
    {icon && <span className="mr-2 text-gray-500 dark:text-gray-400">{icon}</span>}
    <span className="font-medium">{label}</span>
  </Link>
);

export default Navbar;