import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCrKdFTslfSICPexHzA57dI5xaW9oRBvY8",
  authDomain: "nabd-73477.firebaseapp.com",
  projectId: "nabd-73477",
  storageBucket: "nabd-73477.firebasestorage.app",
  messagingSenderId: "486666844642",
  appId: "1:486666844642:web:d429f10f5345ce81ef61bb",
  measurementId: "G-VG0BFVZJXL",
  databaseURL: "https://nabd-73477-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

export { ref, onValue, set, push, update };
