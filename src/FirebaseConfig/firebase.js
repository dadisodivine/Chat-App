import { initializeApp } from "firebase/app";
import { getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore();

// Firestore group chat collections (for group chat support)
// Usage example:
// import { groupsCollection, groupChatsCollection } from '../FirebaseConfig/firebase';
// ...
// await setDoc(doc(groupsCollection, groupId), { ... });
// await setDoc(doc(groupChatsCollection, groupId), { messages: [] });
export const groupsCollection = collection(db, 'groups');
export const groupChatsCollection = collection(db, 'groupChats');
