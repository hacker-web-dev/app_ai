import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    User,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult
  } from 'firebase/auth';
import {app} from './firebase'; 
  // Initialize Firebase Authentication
  const auth = getAuth(app);
  
  // Create a new user
  export const registerUser = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user profile with the full name
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
  
  // Sign in existing user
  export const loginUser = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
  
  // Sign out user
  export const logoutUser = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
  
  // Reset password
  export const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
  
  // Get current user
  export const getCurrentUser = (): User | null => {
    return auth.currentUser;
  };
  
  // Auth state observer
  export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  };

  // Phone Authentication Functions
  let recaptchaVerifier: RecaptchaVerifier | null = null;

  // Setup reCAPTCHA verifier
  export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    try {
      // Clear existing recaptcha if any
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }

      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.log('reCAPTCHA expired');
        }
      });

      return recaptchaVerifier;
    } catch (error: any) {
      console.error('Error setting up reCAPTCHA:', error);
      throw new Error('Failed to setup reCAPTCHA verification');
    }
  };

  // Send OTP to phone number
  export const sendPhoneOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    try {
      // Ensure phone number is in international format
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      console.log('Sending OTP to:', formattedPhoneNumber);
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier);
      
      return confirmationResult;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Please include country code.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/captcha-check-failed') {
        throw new Error('reCAPTCHA verification failed. Please try again.');
      } else {
        throw new Error(error.message || 'Failed to send OTP');
      }
    }
  };

  // Verify OTP and sign in
  export const verifyPhoneOTP = async (confirmationResult: ConfirmationResult, otp: string): Promise<User> => {
    try {
      const userCredential = await confirmationResult.confirm(otp);
      console.log('Phone authentication successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('OTP has expired. Please request a new one.');
      } else {
        throw new Error(error.message || 'Failed to verify OTP');
      }
    }
  };

  // Clear reCAPTCHA
  export const clearRecaptcha = () => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  };

  // Get current auth instance (needed for some operations)
  export const getAuthInstance = () => auth;