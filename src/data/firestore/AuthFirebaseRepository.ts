import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import type { AuthRepository, SesionAuth } from '../../domain/repositories';
import { auth } from './firebase';

/** Implementación de `AuthRepository` con Firebase Auth (correo y contraseña). */
export class AuthFirebaseRepository implements AuthRepository {
  async registrar(correo: string, contrasena: string): Promise<SesionAuth> {
    const credencial = await createUserWithEmailAndPassword(auth, correo, contrasena);
    return { uid: credencial.user.uid };
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<SesionAuth> {
    const credencial = await signInWithEmailAndPassword(auth, correo, contrasena);
    return { uid: credencial.user.uid };
  }

  cerrarSesion(): Promise<void> {
    return signOut(auth);
  }

  sesionActual(): SesionAuth | null {
    const usuario = auth.currentUser;
    return usuario ? { uid: usuario.uid } : null;
  }

  observarSesion(callback: (sesion: SesionAuth | null) => void): () => void {
    return onAuthStateChanged(auth, usuario => {
      callback(usuario ? { uid: usuario.uid } : null);
    });
  }
}
