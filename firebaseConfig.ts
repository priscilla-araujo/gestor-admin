// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyB9MTwZXfsmqgBXjCfCmTQvyI2i0cZQu1I",

  authDomain: "gestoradmin-f3544.firebaseapp.com",

  projectId: "gestoradmin-f3544",

  storageBucket: "gestoradmin-f3544.firebasestorage.app",

  messagingSenderId: "585460323228",

  appId: "1:585460323228:web:e4be3095da7e2ecf2aae59"

};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
