import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyArAk5tqBarl5HnXUBxVuFtsM804oaQ0P8",
  authDomain: "chess-36db4.firebaseapp.com",
  projectId: "chess-36db4",
  storageBucket: "chess-36db4.appspot.com",
  messagingSenderId: "900652274836",
  appId: "1:900652274836:web:c260f4fcb2f6580ed71081"
};

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();
const auth = getAuth(app);
export { auth, provider };
export default app;
