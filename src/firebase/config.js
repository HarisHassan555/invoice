import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCfFMB7z_dU9_LJ_xnFrPwktSDKXPsebCI',
  authDomain: 'invoice-b7251.firebaseapp.com',
  projectId: 'invoice-b7251',
  storageBucket: 'invoice-b7251.firebasestorage.app',
  messagingSenderId: '653524971727',
  appId: '1:653524971727:web:98e1f76118dd0ddbb607ba',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
