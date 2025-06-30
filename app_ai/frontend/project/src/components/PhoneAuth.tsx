import React, { useState, useEffect, useRef } from 'react';
import { Phone, Shield, ArrowLeft, RotateCcw } from 'lucide-react';
import { setupRecaptcha, sendPhoneOTP, verifyPhoneOTP, clearRecaptcha } from '../authservice';
import { ConfirmationResult } from 'firebase/auth';

interface PhoneAuthProps {
  onSuccess: () => void;
  onBackToEmail: () => void;
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ onSuccess, onBackToEmail }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [canResend, setCanResend] = useState<boolean>(false);
  
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaSetup, setRecaptchaSetup] = useState<boolean>(false);

  // Setup reCAPTCHA on component mount
  useEffect(() => {
    if (step === 'phone' && !recaptchaSetup) {
      try {
        setupRecaptcha('recaptcha-container');
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
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits for Indian numbers
    if (digits.length <= 10) {
      return digits;
    }
    return digits.slice(0, 10);
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
      setStep('otp');
      setCountdown(60); // 60 seconds countdown
      setCanResend(false);
    } catch (error: any) {
      setError(error.message);
      // Reset reCAPTCHA on error
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
      await verifyPhoneOTP(confirmationResult, otp);
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
        Back to Email Login
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
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

          {/* reCAPTCHA Container */}
          <div className="flex justify-center">
            <div id="recaptcha-container"></div>
          </div>

          <button
            type="submit"
            disabled={isLoading || phoneNumber.length !== 10}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${
              isLoading || phoneNumber.length !== 10 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Verify Your Phone</h3>
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
                  Verifying...
                </>
              ) : (
                'Verify OTP'
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
            <div id="recaptcha-container"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneAuth;