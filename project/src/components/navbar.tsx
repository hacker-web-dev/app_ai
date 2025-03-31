import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = (): void => {
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

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
        <Link to="/home" className="flex items-center">
            <img 
              src="/src/components/img.jpg" 
              alt="Brand Icon" 
              className={`h-10 w-10 object-contain transition-transform duration-300 ${
          scrolled ? 'scale-100' : 'scale-110'
              }`} 
            />
            <span className={`ml-4 text-4xl font-extrabold tracking-wide ${
              scrolled ? 'text-indigo-600' : 'text-white'
            }`}>
              PriceAI
            </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            to="/#features" 
            className={`hover:text-indigo-600 transition ${
              scrolled ? 'text-gray-800' : 'text-white'
            }`}
          >
            Features
          </Link>
          <Link 
            to="/#how-it-works" 
            className={`hover:text-indigo-600 transition ${
              scrolled ? 'text-gray-800' : 'text-white'
            }`}
          >
            How It Works
          </Link>
          
          <Link 
            to="/#faq" 
            className={`hover:text-indigo-600 transition ${
              scrolled ? 'text-gray-800' : 'text-white'
            }`}
          >
            FAQ
          </Link>
        </div>
        
        
        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              scrolled ? 'text-gray-800' : 'text-white'
            }`}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={`md:hidden absolute left-0 right-0 transition-all duration-300 ease-in-out transform ${
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white shadow-lg px-4 py-6 mt-2">
          <div className="flex flex-col space-y-4">
            <Link 
              to="/#features" 
              onClick={() => setIsOpen(false)}
              className="hover:text-indigo-600 transition"
            >
              Features
            </Link>
            <Link 
              to="/#how-it-works" 
              onClick={() => setIsOpen(false)}
              className="hover:text-indigo-600 transition"
            >
              How It Works
            </Link>
            
            <Link 
              to="/#faq" 
              onClick={() => setIsOpen(false)}
              className="hover:text-indigo-600 transition"
            >
              FAQ
            </Link>
           
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;