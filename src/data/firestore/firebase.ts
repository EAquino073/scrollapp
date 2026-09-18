import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

/**
 * Instancias únicas de Firebase. La app se configura de forma nativa con
 * `android/app/google-services.json`, por lo que no hay que inicializar nada aquí.
 */
export const firebaseApp = getApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
