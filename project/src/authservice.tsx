import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    User
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