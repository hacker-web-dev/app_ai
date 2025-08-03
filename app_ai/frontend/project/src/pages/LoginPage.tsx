import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, Lock, Shield, RotateCcw } from 'lucide-react';
import { 
  loginUser, 
  resetPassword, 
  setupRecaptcha, 
  sendPhoneOTP, 
  verifyPhoneOTP, 
  clearRecaptcha 
} from '../authservice';
import { ConfirmationResult } from 'firebase/auth';

const LoginPage: React.FC = () => {
  // Common states
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState<boolean>(false);
  
  // Email states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [resetSent, setResetSent] = useState<boolean>(false);
  
  // Phone states
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [recaptchaSetup, setRecaptchaSetup] = useState<boolean>(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Setup reCAPTCHA for phone auth
  useEffect(() => {
    if (authMethod === 'phone' && phoneStep === 'phone' && !recaptchaSetup) {
      try {
        setupRecaptcha('recaptcha-container');
        setRecaptchaSetup(true);
      } catch (error: any) {
        setError('Failed to load verification system. Please refresh the page.');
      }
    }

    return () => {
      if (authMethod !== 'phone') {
        clearRecaptcha();
      }
    };
  }, [authMethod, phoneStep, recaptchaSetup]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && phoneStep === 'otp') {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, phoneStep]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await loginUser(email, password);
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length <= 10 ? digits : digits.slice(0, 10);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const confirmation = await sendPhoneOTP(phoneNumber, recaptchaVerifier);
      
      setConfirmationResult(confirmation);
      setPhoneStep('otp');
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      setError(error.message);
      setRecaptchaSetup(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmationResult || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verifyPhoneOTP(confirmationResult, otp);
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError('');

    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const confirmation = await sendPhoneOTP(phoneNumber, recaptchaVerifier);
      
      setConfirmationResult(confirmation);
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAuthMethod = (method: 'email' | 'phone') => {
    setAuthMethod(method);
    setError('');
    setResetSent(false);
    setPhoneStep('phone');
    setOtp('');
    setCountdown(0);
    setCanResend(false);
    setRecaptchaSetup(false);
  };

  const handleBackToPhone = () => {
    setPhoneStep('phone');
    setOtp('');
    setError('');
    setConfirmationResult(null);
    setCountdown(0);
    setCanResend(false);
    setRecaptchaSetup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div 
          className={`w-full max-w-md transform transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700 px-8 py-10 text-white">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold">Welcome Back</h1>
                <p className="mt-2 opacity-90">Sign in to your PriceAI account</p>
              </div>
              
              {/* Auth Method Selector */}
              <div className="flex bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-30 rounded-lg p-1">
                <button
                  onClick={() => handleSwitchAuthMethod('email')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    authMethod === 'email'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-white hover:bg-white hover:bg-opacity-10 dark:hover:bg-gray-700 dark:hover:bg-opacity-20'
                  }`}
                >
                  <Mail size={16} className="mr-2" />
                  Email
                </button>
                <button
                  onClick={() => handleSwitchAuthMethod('phone')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    authMethod === 'phone'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-white hover:bg-white hover:bg-opacity-10 dark:hover:bg-gray-700 dark:hover:bg-opacity-20'
                  }`}
                >
                  <Phone size={16} className="mr-2" />
                  Phone
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}
              
              {resetSent && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg">
                  Password reset email sent! Please check your inbox.
                </div>
              )}

              {/* Email Login */}
              {authMethod === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-300"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-300"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300 ${
                      isLoading ? 'opacity-80 cursor-wait' : ''
                    }`}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Phone Login */}
              {authMethod === 'phone' && (
                <>
                  {phoneStep === 'phone' && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="absolute inset-y-0 left-10 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">+91</span>
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                            required
                            className="block w-full pl-20 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-300"
                            placeholder="9876543210"
                            maxLength={10}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Enter your 10-digit mobile number
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <div id="recaptcha-container"></div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || phoneNumber.length !== 10}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300 ${
                          isLoading || phoneNumber.length !== 10 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isLoading ? 'Sending OTP...' : 'Send OTP'}
                      </button>
                    </form>
                  )}

                  {phoneStep === 'otp' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900">
                          <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Verify Your Phone</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          We've sent a 6-digit code to +91 {phoneNumber}
                        </p>
                      </div>

                      <form onSubmit={handleOtpSubmit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Enter OTP
                          </label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-300 text-center text-lg tracking-widest"
                            placeholder="123456"
                            maxLength={6}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || otp.length !== 6}
                          className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300 ${
                            isLoading || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </form>

                      <div className="text-center">
                        {countdown > 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Resend OTP in {countdown} seconds
                          </p>
                        ) : (
                          <button
                            onClick={handleResendOtp}
                            disabled={isLoading || !canResend}
                            className="flex items-center justify-center mx-auto text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw size={14} className="mr-1" />
                            Resend OTP
                          </button>
                        )}
                      </div>

                      <div className="text-center">
                        <button
                          onClick={handleBackToPhone}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          Change phone number
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; 2025 PriceAI. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;