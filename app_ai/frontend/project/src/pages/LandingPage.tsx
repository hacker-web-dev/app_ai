import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, DollarSign, Heart, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import Navbar from '../components/navbar';

const LandingPage = ({ dashboardMode = false }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section with Search Button */}
      <section className="relative bg-gradient-to-br from-indigo-600 to-indigo-800 pt-24 pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Find and Compare Healthcare Prices
            </h1>
            <p className="text-xl text-indigo-100 mb-8">
              Save money on your healthcare by comparing prices from providers in your area.
            </p>
            
            {/* Statistics */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                <div className="text-3xl font-bold">40%</div>
                <div className="text-sm text-indigo-100">Average Savings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                <div className="text-3xl font-bold">1000+</div>
                <div className="text-sm text-indigo-100">Healthcare Services</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                <div className="text-3xl font-bold">5000+</div>
                <div className="text-sm text-indigo-100">Providers Nationwide</div>
              </div>
            </div>
            
            {/* Search Button */}
            <div className="mt-10">
              <button 
                onClick={() => navigate('/search')}
                className="px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center mx-auto"
              >
                <Search className="mr-2 h-5 w-5" />
                Search Healthcare Services
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 mt-10" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How PriceAI Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 dark:text-gray-300">
              Our platform makes it easy to find the best healthcare prices in your area, saving you time and money.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Search Services</h3>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">
                Enter your location and the healthcare service you need to find providers near you.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Compare Prices</h3>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">
                See transparent pricing information and compare costs across different providers.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Save Money</h3>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">
                Choose the provider that offers the best value for your healthcare needs.
              </p>
            </div>
          </div>
          
          {/* How It Works Steps */}
          <div className="mt-20" id="how-it-works">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Find Healthcare Savings in 3 Steps</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 dark:text-gray-300">
                PriceAI makes it simple to find affordable healthcare services
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">1</div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md h-full">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pt-4">Enter Your Location</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Start by entering your ZIP code to find healthcare providers in your area.
                  </p>
                  <img src="/api/placeholder/300/200" alt="Enter location" className="rounded-lg w-full" />
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">2</div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md h-full">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pt-4">Select a Service</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Choose the healthcare service you need, from routine check-ups to specialized procedures.
                  </p>
                  <img src="/api/placeholder/300/200" alt="Select service" className="rounded-lg w-full" />
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">3</div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md h-full">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pt-4">Compare & Save</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Review prices from different providers and choose the option that works best for you.
                  </p>
                  <img src="/api/placeholder/300/200" alt="Compare and save" className="rounded-lg w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20" id="faq">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Get answers to common questions about PriceAI and healthcare price transparency.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {/* FAQ Item 1 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">How accurate are the prices on PriceAI?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our prices are sourced directly from healthcare providers and hospitals, and we update them regularly to ensure accuracy. However, prices may vary based on individual circumstances.
                </p>
              </div>
              
              {/* FAQ Item 2 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Does PriceAI work with all insurance plans?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  PriceAI works with major insurance providers including Aetna, Humana, United Healthcare, Highmark, and Amerihealth. We're continuously adding more insurance plans to our system.
                </p>
              </div>
              
              {/* FAQ Item 3 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">How do I know which provider is best for me?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  PriceAI helps you compare prices, but you should also consider factors like provider reputation, location, and services offered. We recommend consulting with your primary care physician.
                </p>
              </div>
              
              {/* FAQ Item 4 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Is PriceAI free to use?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, PriceAI is completely free for patients to use. We believe everyone deserves access to transparent healthcare pricing information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Saving on Healthcare?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Join thousands of people who have saved money on their healthcare costs with PriceAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/search')}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <Search className="mr-2 h-5 w-5" />
              Compare Prices Now
            </button>
            <button 
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              Learn More
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600 text-white mr-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                  <path d="M12 12L2 12"></path>
                  <path d="M12 12l4.6 4.6"></path>
                  <path d="M12 12l4.6-4.6"></path>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">PriceAI</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">About</a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>© 2025 PriceAI. All rights reserved.</p>
            <p className="mt-4 md:mt-0">Making healthcare transparent and affordable</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;