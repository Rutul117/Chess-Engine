import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GithubAuthProvider,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, provider as googleProvider } from '../config/firebase';

const AuthContext = createContext(null);  // Initializing with null

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [githubToken, setGithubToken] = useState(null);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGithub(useRedirect = false) {
    const githubProvider = new GithubAuthProvider();
    githubProvider.addScope('read:user');
    githubProvider.addScope('user:email');
    
    try {
      let result;
      if (useRedirect) {
        await signInWithRedirect(auth, githubProvider);
        return;
      } else {
        result = await signInWithPopup(auth, githubProvider);
      }
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      setGithubToken(token);
      return result;
    } catch (error) {
      if (error.code === 'auth/popup-blocked' && !useRedirect) {
        return loginWithGithub(true);
      }
      throw error;
    }
  }

  async function loginWithGoogle(useRedirect = false) {
    try {
      let result;
      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return;
      } else {
        result = await signInWithPopup(auth, googleProvider);
      }
      return result;
    } catch (error) {
      if (error.code === 'auth/popup-blocked' && !useRedirect) {
        return loginWithGoogle(true);
      }
      throw error;
    }
  }

  async function logout() {
    setGithubToken(null);
    return signOut(auth);
  }

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        setGithubToken(token);
      }
    }).catch((error) => {
      console.error("Redirect result error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    githubToken,
    signup,
    login,
    loginWithGithub,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
