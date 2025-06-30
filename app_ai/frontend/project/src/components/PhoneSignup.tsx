import React, { useState, useEffect } from 'react';
import { Phone, Shield, User, ArrowLeft, RotateCcw } from 'lucide-react';
import { setupRecaptcha, sendPhoneOTP, verifyPhoneOTP, clearRecaptcha } from '../authservice';
import { ConfirmationResult } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';

interface PhoneSignupProps {
  onSuccess: () => void;
  onBackToEmail: () => void;
}

const PhoneSignup: React.FC<PhoneSignupProps> = ({ onSuccess, onBackToEmail }) => {
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [step, setStep] = useState<'details' | 'phone' | 'otp'>('details');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [canResend, setCanResend] = useState<boolean>(false);
  
  const [recaptchaSetup, setRecaptchaSetup] = useState<boolean>(false);

  // Setup reCAPTCHA when needed
  useEffect(() => {
    if (step === 'phone' && !recaptchaSetup) {
      try {
        setupRecaptcha('recaptcha-container-signup');
        setRecaptchaSetup(true);
      } catch (error: any) {
        setError('Failed to load verification system. Please refresh the page.');
      }
    }

    // Cleanup on unmount
    return () => {
      clearRecaptcha();
    };
  }, [step, recaptchaSetup]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && step === 'otp') {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits;
    }
    return digits.slice(0, 10);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }

    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setStep('phone');
    setError('');
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container-signup');
      const confirmation = await sendPhoneOTP(phoneNumber, recaptchaVerifier);
      
      setConfirmationResult(confirmation);
      setStep('otp');
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
    
    if (!confirmationResult) {
      setError('Please request OTP first');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await verifyPhoneOTP(confirmationResult, otp);
      
      // Update user profile with full name
      await updateProfile(user, {
        displayName: fullName
      });
      
      onSuccess();
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
      const recaptchaVerifier = setupRecaptcha('recaptcha-container-signup');
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

  const handleBackToDetails = () => {
    setStep('details');
    setError('');
    setRecaptchaSetup(false);
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setConfirmationResult(null);
    setCountdown(0);
    setCanResend(false);
    setRecaptchaSetup(false);
  };

  return (
    <div className="space-y-6">
      {/* Back to Email Button */}
      <button
        onClick={onBackToEmail}
        className="flex items-center text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Email Signup
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 'details' && (
        <form onSubmit={handleDetailsSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 left-10 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">+91</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                required
                className="block w-full pl-20 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter your 10-digit mobile number
            </p>
          </div>

          <button
            type="submit"
            disabled={fullName.trim().length < 2 || phoneNumber.length !== 10}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${
              fullName.trim().length < 2 || phoneNumber.length !== 10 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Continue
          </button>
        </form>
      )}

      {step === 'phone' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Verify Your Phone</h3>
            <p className="mt-1 text-sm text-gray-500">
              We'll send a verification code to +91 {phoneNumber}
            </p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            {/* reCAPTCHA Container */}
            <div className="flex justify-center">
              <div id="recaptcha-container-signup"></div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-2 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Enter Verification Code</h3>
            <p className="mt-1 text-sm text-gray-500">
              We've sent a 6-digit code to +91 {phoneNumber}
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-center text-lg tracking-widest"
                placeholder="123456"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${
                isLoading || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend OTP in {countdown} seconds
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={isLoading || !canResend}
                className="flex items-center justify-center mx-auto text-sm text-indigo-600 hover:text-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={14} className="mr-1" />
                Resend OTP
              </button>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={handleBackToPhone}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Change phone number
            </button>
          </div>

          {/* reCAPTCHA Container for resend */}
          <div className="hidden">
            <div id="recaptcha-container-signup"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneSignup;