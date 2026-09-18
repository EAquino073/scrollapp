/**
 * Punto de entrada de la interfaz. Toda la lógica vive en src/:
 * presentation (pantallas y ViewModels) -> domain (casos de uso) -> data (Firestore) / native.
 */
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Navegacion } from './src/presentation/navigation/Navegacion';
import { useTema } from './src/presentation/theme/tema';
import { SesionProvider } from './src/presentation/viewmodels/SesionContext';

function App() {
  const { esOscuro } = useTema();
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} />
      <SesionProvider>
        <Navegacion />
      </SesionProvider>
    </SafeAreaProvider>
  );
}

export default App;
