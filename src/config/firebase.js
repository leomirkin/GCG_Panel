// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOpoz9rV9jaRf4oQBQeC2z_nS-EguykXM",
  authDomain: "corporate-dashboard-ca915.firebaseapp.com",
  projectId: "corporate-dashboard-ca915",
  storageBucket: "corporate-dashboard-ca915.appspot.com",
  messagingSenderId: "135080897957",
  appId: "1:135080897957:web:7ba5a890dbacadc3150c4c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export initialized instances
export { auth, db };
export default app; 