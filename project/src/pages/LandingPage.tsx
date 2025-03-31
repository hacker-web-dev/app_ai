import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import { ArrowRight, Search, DollarSign, BarChart2, ThumbsUp, Home, Globe } from 'lucide-react';

const LandingPage: React.FC = () => {
  useEffect(() => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
        if (href) {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth'
            });
          }
        }
      });
    });

    // Cleanup event listeners
    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', () => {});
      });
    };
  }, []);

  return (
    <div className="font-sans antialiased text-gray-800">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white pt-32 pb-16 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 transform transition duration-500 hover:scale-105">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Compare Healthcare Costs and Save Money</h1>
              <p className="text-xl md:text-2xl mb-8">Find the best healthcare providers in your area and compare prices with and without insurance coverage.</p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/signup" className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition duration-300 flex items-center justify-center">
                  Get Started 
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a href="#how-it-works" className="px-6 py-3 border border-white rounded-lg hover:bg-white hover:text-indigo-600 transition duration-300 text-center">
                  Learn More
                </a>
              </div>
            </div>
            {/* <div className="md:w-1/2 transform transition duration-500 hover:scale-105">
              <img src="/api/placeholder/600/400" alt="Healthcare Price Comparison" className="rounded-lg shadow-xl" />
            </div> */}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 -mt-16 relative z-10 transform transition duration-500 hover:shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Find Healthcare Services Near You</h2>
            <form className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                  Service/Procedure
                </label>
                <input
                  type="text"
                  id="service"
                  placeholder="MRI, Colonoscopy, 2D Echo..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  placeholder="City, ZIP code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance (Optional)
                </label>
                <select
                  id="insurance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                >
                  <option value="">Select Insurance</option>
                  <option value="aetna">Aetna</option>
                  <option value="humana">Humana</option>
                  <option value="uhg">United Healthcare</option>
                  <option value="upmc">UPMC</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition duration-300 flex items-center justify-center"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-2 transition duration-300">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Search Services</h3>
              <p className="text-gray-600">Find specific healthcare services and procedures in your vicinity with our easy-to-use search tool.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-2 transition duration-300">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Price Transparency</h3>
              <p className="text-gray-600">View detailed cost breakdowns with and without insurance coverage for each provider.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-2 transition duration-300">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <BarChart2 className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Compare Providers</h3>
              <p className="text-gray-600">Easily compare multiple providers side-by-side to find the best option for your needs.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-2 transition duration-300">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <ThumbsUp className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Recommendations</h3>
              <p className="text-gray-600">Get personalized recommendations for the most cost-effective options based on your search.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-2 transition duration-300">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Home className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">In-Network Pricing</h3>
              <p className="text-gray-600">Select your health insurance carrier to view in-network cost breakdowns and save money.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-2 transition duration-300">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Out-of-Network Options</h3>
              <p className="text-gray-600">View out-of-network cost breakdowns if your preferred provider isn't covered by your insurance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center transform transition duration-300 hover:scale-105">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Search</h3>
              <p className="text-gray-600">Enter the healthcare service you need and your location</p>
            </div>
            <div className="text-center transform transition duration-300 hover:scale-105">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Compare</h3>
              <p className="text-gray-600">View providers and their pricing with and without insurance</p>
            </div>
            <div className="text-center transform transition duration-300 hover:scale-105">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Select</h3>
              <p className="text-gray-600">Choose the best provider based on cost and quality</p>
            </div>
            <div className="text-center transform transition duration-300 hover:scale-105">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Save</h3>
              <p className="text-gray-600">Save money on your healthcare expenses</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link to="/signup" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition duration-300 inline-flex items-center">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      

      {/* FAQ */}
      <section id="faq" className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg transform transition duration-300 hover:shadow-md">
              <h3 className="text-xl font-bold mb-2">How accurate are the prices shown?</h3>
              <p className="text-gray-600">Our prices are based on the most recent data provided by healthcare providers and insurance companies. We update our database regularly to ensure accuracy.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg transform transition duration-300 hover:shadow-md">
              <h3 className="text-xl font-bold mb-2">Is there a cost to use PriceAI?</h3>
              <p className="text-gray-600">No, PriceAI is completely free for patients. We believe in transparency in healthcare pricing and want to make this information accessible to everyone.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg transform transition duration-300 hover:shadow-md">
              <h3 className="text-xl font-bold mb-2">How do I find my insurance carrier?</h3>
              <p className="text-gray-600">You can select your insurance carrier from the dropdown menu when searching for services. We currently support major carriers like Aetna, Humana, United Healthcare, and UPMC.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg transform transition duration-300 hover:shadow-md">
              <h3 className="text-xl font-bold mb-2">Can I see prices for services not covered by my insurance?</h3>
              <p className="text-gray-600">Yes, we show both in-network and out-of-network pricing for all services, so you can make informed decisions even if a service isn't covered by your insurance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Save on Healthcare Costs?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join thousands of users who have already saved money by comparing healthcare prices with PriceAI.</p>
          <Link to="/signup" className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition duration-300 inline-flex items-center">
            Create Free Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
              src="/src/components/img.jpg" 
              alt="Brand Icon" 
          className={`h-10 w-10 object-contain transition-transform duration-300 ${
            true ? 'scale-100' : 'scale-110'
          }`} 
            />
                <span className="ml-2 text-2xl font-bold">PriceAI</span>
              </div>
              <p className="text-gray-400">Making healthcare pricing transparent and accessible for everyone.</p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition duration-300">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition duration-300">How It Works</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition duration-300">Testimonials</a></li>
                <li><a href="#faq" className="text-gray-400 hover:text-white transition duration-300">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition duration-300">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition duration-300">Contact</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white transition duration-300">Careers</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white transition duration-300">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition duration-300">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white transition duration-300">Terms of Service</Link></li>
                <li><Link to="/hipaa" className="text-gray-400 hover:text-white transition duration-300">HIPAA Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400">&copy; 2025 PriceAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;