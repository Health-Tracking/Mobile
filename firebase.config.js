import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBLfeqv9IaAH8-40_KiIWCEf0cYGXaq2d4",
    authDomain: "health-tracking-cc765.firebaseapp.com",
    projectId: "health-tracking-cc765",
    storageBucket: "health-tracking-cc765.appspot.com",
    messagingSenderId: "427207502356",
    appId: "1:427207502356:web:7a884ddfd49595eca9d501",
    measurementId: "G-64H0CX7YPG"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 초기화
export const db = getFirestore(app);

