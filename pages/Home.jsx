
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

import { useGame } from '../context/GameContext';

function Ranking({ titulo, puntajes, mensajeVacio }) {
  const mejoresPuntajes = [...puntajes]
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 10);

  return (
    <View style={styles.rankingContainer}>
      <Text style={styles.rankingTitle}>{titulo}</Text>

      {mejoresPuntajes.length === 0 ? (
        <Text style={styles.empty}>{mensajeVacio}</Text>
      ) : (
        mejoresPuntajes.map((item, index) => (
          <View
            key={`${item.nombre}-${item.fecha}-${index}`}
            style={styles.rankRow}
          >
            <Text style={styles.rankText}>
              {index + 1}. {item.nombre}
            </Text>

            <Text style={styles.rankText}>
              {item.puntaje} pts
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function Home({ onJugar }) {
  const {
    playerName,
    setPlayerName,
    setGameMode,
    leaderboardPaises,
    leaderboardCapitales,
    loading,
    error,
  } = useGame();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌎 GeoQuiz</Text>

      <Text style={styles.subtitle}>
        Poné a prueba tus conocimientos del mundo
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del jugador"
        value={playerName}
        onChangeText={setPlayerName}
        maxLength={25}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setGameMode('banderas');
          onJugar();
        }}
      >
        <Text style={styles.buttonText}>
          🏳️ Adivinar banderas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonDark}
        onPress={() => {
          setGameMode('capitales');
          onJugar();
        }}
      >
        <Text style={styles.buttonText}>
          🏙️ Adivinar capitales
        </Text>
      </TouchableOpacity>

      {loading && <Text>Cargando países...</Text>}

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

        <Ranking
            titulo="🏳️ Ranking de países"
            puntajes={leaderboardPaises}
            mensajeVacio="Todavía no hay puntajes de banderas."
        />

        <Ranking
            titulo="🏙️ Ranking de capitales"
            puntajes={leaderboardCapitales}
            mensajeVacio="Todavía no hay puntajes de capitales."
        />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F3F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#163B70',
  },
  subtitle: {
    textAlign: 'center',
    color: '#526780',
    marginTop: 8,
    marginBottom: 28,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DFEC',
    marginBottom: 18,
  },
  button: {
    width: '100%',
    backgroundColor: '#1677FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDark: {
    width: '100%',
    backgroundColor: '#163B70',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  rankingContainer: {
    width: '100%',
    marginTop: 28,
  },
  rankingTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#163B70',
    marginBottom: 12,
  },
  empty: {
    color: '#526780',
    marginBottom: 8,
  },
  rankRow: {
    width: '100%',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rankText: {
    color: '#163B70',
    fontWeight: '600',
  },
  error: {
    color: '#B91C1C',
    marginTop: 12,
  },
});
