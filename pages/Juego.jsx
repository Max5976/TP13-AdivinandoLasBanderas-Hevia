
import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  Keyboard,
} from 'react-native';

import { useGame } from '../context/GameContext';

import { traducirPais } from '../services/nombresPaises';
import { traducirCapital } from '../services/nombresCapitales';

function emojiBandera(iso2 = '') {
  if (iso2.length !== 2) return '🌎';

  return String.fromCodePoint(
    ...iso2.toUpperCase().split('').map(
      (letra) => 127397 + letra.charCodeAt(0)
    )
  );
}

function normalizar(texto = '') {
  return texto.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export default function Juego({ onVolver }) {
  const {
    countries,
    currentCountry,
    capitalOptions,
    score,
    playerName,
    gameMode,
    timeLeft,
    hintLetters,
    gameStarted,
    loading,
    error,
    message,
    iniciarJuego,
    responder,
    usarPista,
    reiniciarJuego,
    salirJuego,
  } = useGame();

  const [respuesta, setRespuesta] = useState('');
  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false);
  const [flagFailed, setFlagFailed] = useState(false);

  useEffect(() => {
    setFlagFailed(false);
  }, [currentCountry]);

  const sugerencias = gameMode === 'banderas' && respuesta.trim()
    ? countries
        .filter((pais) => {
          const nombreEspanol =
            pais.nombreEspanol || traducirPais(pais.name);

          return (
            normalizar(pais.name).includes(normalizar(respuesta)) ||
            normalizar(nombreEspanol).includes(normalizar(respuesta))
          );
        })
        .slice(0, 6)
    : [];

  function seleccionarPais(pais) {
    setRespuesta(pais.nombreEspanol || traducirPais(pais.name));
    setSugerenciasAbiertas(false);
    Keyboard.dismiss();
  }

  function enviar(respuestaElegida = respuesta) {
    if (!respuestaElegida.trim()) return;

    responder(respuestaElegida);
    setRespuesta('');
    setSugerenciasAbiertas(false);
    Keyboard.dismiss();
  }

  async function volverAlMenu() {
    await salirJuego();
    onVolver();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Cargando países...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={onVolver}>
          <Text style={styles.buttonText}>Volver al menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!gameStarted || !currentCountry) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          {gameMode === 'banderas' ? '🏳️ Modo banderas' : '🏙️ Modo capitales'}
        </Text>
        <Text style={styles.subtitle}>
          Jugador: {playerName.trim() || 'Invitado'}
        </Text>

        <TouchableOpacity style={styles.button} onPress={iniciarJuego}>
          <Text style={styles.buttonText}>Comenzar partida</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onVolver}>
          <Text style={styles.link}>Volver al menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const letrasPista = (
    currentCountry.nombreEspanol || traducirPais(currentCountry.name)
  )
    .split('')
    .map((letra, indice) =>
      letra === ' ' || hintLetters.includes(indice) ? letra : '_'
    )
    .join(' ');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {gameMode === 'banderas' ? 'Adiviná la bandera' : 'Adiviná la capital'}
      </Text>

      <Text style={styles.player}>
        Jugador: {playerName.trim() || 'Invitado'}
      </Text>

      <Text style={styles.score}>Puntaje: {score}</Text>
      <Text style={styles.timer}>⏱️ {timeLeft} segundos</Text>

      {gameMode === 'banderas' && (
        <>
          {currentCountry.flag && !flagFailed ? (
            <Image
              source={{ uri: currentCountry.flag }}
              style={styles.flag}
              resizeMode="contain"
              onError={() => setFlagFailed(true)}
            />
          ) : (
            <View style={styles.emojiContainer}>
              <Text style={styles.flagEmoji}>
                {emojiBandera(currentCountry.iso2)}
              </Text>
            </View>
          )}

          <Text style={styles.question}>
            ¿A qué país pertenece esta bandera?
          </Text>

          {hintLetters.length > 0 && (
            <Text style={styles.hint}>{letrasPista}</Text>
          )}

          <View style={styles.autocomplete}>
            <TextInput
              style={styles.input}
              placeholder="Escribí el país..."
              value={respuesta}
              onChangeText={(texto) => {
                setRespuesta(texto);
                setSugerenciasAbiertas(true);
              }}
              onFocus={() => setSugerenciasAbiertas(true)}
              onSubmitEditing={() => enviar()}
              autoCorrect={false}
            />

            {sugerenciasAbiertas && sugerencias.length > 0 && (
              <View style={styles.dropdown}>
                {sugerencias.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.name}-${index}`}
                    style={styles.suggestion}
                    onPress={() => seleccionarPais(item)}
                  >
                    <Text>
                      {item.nombreEspanol || traducirPais(item.name)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => enviar()}
          >
            <Text style={styles.buttonText}>Responder</Text>
          </TouchableOpacity>
        </>
      )}

      {gameMode === 'capitales' && (
        <>
          {currentCountry.flag && !flagFailed ? (
            <Image
              source={{ uri: currentCountry.flag }}
              style={styles.flag}
              resizeMode="contain"
              onError={() => setFlagFailed(true)}
            />
          ) : (
            <View style={styles.emojiContainer}>
              <Text style={styles.flagEmoji}>
                {emojiBandera(currentCountry.iso2)}
              </Text>
            </View>
          )}

          <Text style={styles.question}>
            ¿Cuál es la capital de {
              currentCountry.nombreEspanol || traducirPais(currentCountry.name)
            }?
          </Text>

          {capitalOptions.map((capital) => (
            <TouchableOpacity
              key={capital}
              style={styles.option}
              onPress={() => enviar(capital)}
            >
              <Text style={styles.optionText}>
                {traducirCapital(capital)}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity style={styles.hintButton} onPress={usarPista}>
        <Text style={styles.buttonText}>💡 Usar pista (-2 segundos)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.restartButton}
        onPress={reiniciarJuego}
      >
        <Text style={styles.buttonText}>🔄 Reiniciar partida</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={volverAlMenu}>
        <Text style={styles.link}>Salir al menú</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F3F7FF',
    alignItems: 'center',
    padding: 24,
    paddingTop: 45,
  },
  center: {
    flex: 1,
    backgroundColor: '#F3F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#163B70',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    color: '#526780',
  },
  player: {
    color: '#526780',
    marginTop: 10,
  },
  score: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 14,
    color: '#163B70',
  },
  timer: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  flag: {
    width: 280,
    height: 165,
    marginVertical: 20,
  },
  emojiContainer: {
    width: 280,
    height: 165,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  flagEmoji: {
    fontSize: 100,
  },
  question: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    color: '#163B70',
  },
  autocomplete: {
    width: '100%',
    zIndex: 2,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DFEC',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DFEC',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F7',
  },
  button: {
    width: '100%',
    backgroundColor: '#1677FF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  option: {
    width: '100%',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DFEC',
    marginBottom: 10,
  },
  optionText: {
    textAlign: 'center',
    color: '#163B70',
    fontWeight: '600',
  },
  hintButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#00A884',
    alignItems: 'center',
    marginTop: 14,
  },
  restartButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#163B70',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginTop: 16,
    color: '#163B70',
    fontWeight: '600',
  },
  hint: {
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 12,
    color: '#163B70',
  },
  link: {
    color: '#1677FF',
    marginTop: 20,
    marginBottom: 30,
  },
  error: {
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 15,
  },
});
