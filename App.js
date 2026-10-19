
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider } from './context/GameContext';
import Home from './pages/Home';
import Juego from './pages/Juego';

function AppContent() {
  const [pantalla, setPantalla] = useState('home');

  return (
    <>
      <StatusBar style="dark" />

      {pantalla === 'home' ? (
        <Home onJugar={() => setPantalla('juego')} />
      ) : (
        <Juego onVolver={() => setPantalla('home')} />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </SafeAreaProvider>
  );
}
