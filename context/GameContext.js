import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  obtenerPaises,
  obtenerCapitales,
} from '../services/paisesApi';

import { traducirPais } from '../services/nombresPaises';
import { traducirCapital } from '../services/nombresCapitales';

const GameContext = createContext(null);
const CLAVE_RANKING = '@geoquiz/ranking';
const DURACION = 15;

function normalizar(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function elegirAleatorio(lista) {
  if (!lista.length) return null;
  return lista[Math.floor(Math.random() * lista.length)];
}

function crearOpciones(pais, paises) {
  if (!pais?.capital) return [];

  const otrasCapitales = [
    ...new Set(
      paises
        .filter((p) => p.capital && p.name !== pais.name)
        .map((p) => p.capital)
        .filter((capital) =>
          normalizar(capital) !== normalizar(pais.capital)
        )
    ),
  ];

  const distractores = otrasCapitales
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return [...distractores, pais.capital]
    .sort(() => Math.random() - 0.5);
}

export function GameProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [currentCountry, setCurrentCountry] = useState(null);
  const [capitalOptions, setCapitalOptions] = useState([]);

  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState('banderas');

  const [timeLeft, setTimeLeft] = useState(DURACION);
  const [hintLetters, setHintLetters] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Cargar países, capitales y ranking al iniciar la aplicación.
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        setError(null);

        const [banderas, capitales] = await Promise.all([
          obtenerPaises(),
          obtenerCapitales(),
        ]);

        const mapaCapitales = new Map();

        capitales.forEach((item) => {
          const nombre = item.country || item.name;
          if (nombre && item.capital) {
            mapaCapitales.set(normalizar(nombre), item.capital);
          }
        });

        const lista = banderas
          .filter((pais) => pais.name)
          .map((pais) => {
            const iso2 = (
              pais.iso2 || pais.Iso2 || ''
            ).toLowerCase();

            const capital = mapaCapitales.get(
              normalizar(pais.name)
            ) || null;

            return {
              ...pais,
              iso2,
              flag: iso2
                ? `https://flagcdn.com/w320/${iso2}.png`
                : null,
              capital,
              nombreEspanol: traducirPais(pais.name),
              capitalEspanol: traducirCapital(capital),
            };
          });

        if (!lista.length) {
          throw new Error('La API no devolvió países.');
        }

        setCountries(lista);

        const rankingGuardado =
          await AsyncStorage.getItem(CLAVE_RANKING);

        if (rankingGuardado) {
          setLeaderboard(JSON.parse(rankingGuardado));
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  function elegirPais() {
    const disponibles = gameMode === 'capitales'
      ? countries.filter((pais) => pais.capital)
      : countries.filter((pais) => pais.flag || pais.iso2);

    return elegirAleatorio(disponibles);
  }

  function siguientePregunta() {
    const pais = elegirPais();

    setCurrentCountry(pais);
    setCapitalOptions(
      gameMode === 'capitales'
        ? crearOpciones(pais, countries)
        : []
    );

    setTimeLeft(DURACION);
    setHintLetters([]);
  }

  function iniciarJuego() {
    if (!countries.length) return;

    setScore(0);
    setMessage('');
    setGameStarted(true);
    siguientePregunta();
  }

  async function guardarPuntaje() {
    if (!playerName.trim() || score <= 0) return;

    try {
      const nuevoRanking = [
        ...leaderboard,
        {
          nombre: playerName.trim(),
          puntaje: score,
          modo: gameMode,
          fecha: new Date().toISOString(),
        },
      ]
        .sort((a, b) => b.puntaje - a.puntaje)
        .slice(0, 10);

      await AsyncStorage.setItem(
        CLAVE_RANKING,
        JSON.stringify(nuevoRanking)
      );

      setLeaderboard(nuevoRanking);
    } catch (err) {
      console.warn('No se pudo guardar el ranking:', err);
    }
  }

  async function reiniciarJuego() {
    await guardarPuntaje();
    iniciarJuego();
  }

  async function salirJuego() {
    await guardarPuntaje();
    setGameStarted(false);
    setCurrentCountry(null);
    setCapitalOptions([]);
    setScore(0);
    setTimeLeft(DURACION);
    setHintLetters([]);
    setMessage('');
  }

  function responder(respuesta) {
    if (!gameStarted || !currentCountry) return;

    const respuestasCorrectas = gameMode === 'capitales'
      ? [currentCountry.capital, currentCountry.capitalEspanol]
      : [currentCountry.name, currentCountry.nombreEspanol];

    const esCorrecta = respuestasCorrectas.some(
      (nombre) =>
        nombre && normalizar(respuesta) === normalizar(nombre)
    );

    if (esCorrecta) {
      setScore((actual) => actual + 10 + timeLeft);
      setMessage(`¡Correcto! +${10 + timeLeft} puntos`);
      siguientePregunta();
    } else {
      setScore((actual) => actual - 1);
      setMessage('Incorrecto. -1 punto');
    }
  }


  function usarPista() {
    if (!gameStarted || !currentCountry || timeLeft <= 0) return;

    if (gameMode === 'banderas') {
      const posiciones = currentCountry.name
        .split('')
        .map((letra, indice) =>
          letra !== ' ' && !hintLetters.includes(indice)
            ? indice
            : null
        )
        .filter((indice) => indice !== null);

      const posicion = elegirAleatorio(posiciones);

      if (posicion !== null && posicion !== undefined) {
        setHintLetters((actual) => [...actual, posicion]);
        setMessage('Pista utilizada: -2 segundos');
        setTimeLeft((actual) => Math.max(0, actual - 2));
      }
    } else {
      const incorrectas = capitalOptions.filter(
        (capital) =>
          normalizar(capital) !== normalizar(currentCountry.capital)
      );

      if (!incorrectas.length) return;

      const eliminar = elegirAleatorio(incorrectas);

      setCapitalOptions((actual) =>
        actual.filter((capital) => capital !== eliminar)
      );

      setMessage('Pista utilizada: -2 segundos');
      setTimeLeft((actual) => Math.max(0, actual - 2));
    }
  }

  // El cronómetro funciona solo durante una partida.
  useEffect(() => {
    if (!gameStarted) return;

    const intervalo = setInterval(() => {
      setTimeLeft((actual) => Math.max(0, actual - 1));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [gameStarted]);

  // Al agotarse el tiempo, se pasa a la siguiente pregunta.
  useEffect(() => {
    if (!gameStarted || timeLeft !== 0) return;

    setMessage('¡Se acabó el tiempo!');
    siguientePregunta();
  }, [timeLeft, gameStarted]);

  // En modo capitales se elimina una opción incorrecta
  // automáticamente a los 10 y 5 segundos.
  useEffect(() => {
    if (
      !gameStarted ||
      gameMode !== 'capitales' ||
      !currentCountry ||
      ![5, 10].includes(timeLeft)
    ) {
      return;
    }

    setCapitalOptions((actual) => {
      const incorrectas = actual.filter(
        (capital) =>
          normalizar(capital) !== normalizar(currentCountry.capital)
      );

      if (!incorrectas.length) return actual;

      const eliminar = elegirAleatorio(incorrectas);
      return actual.filter((capital) => capital !== eliminar);
    });
  }, [timeLeft, gameStarted, gameMode, currentCountry]);

  const leaderboardPaises = leaderboard.filter(
    (item) => (item.modo || 'banderas') === 'banderas'
  );

  const leaderboardCapitales = leaderboard.filter(
    (item) => item.modo === 'capitales'
  );

  const value = {
    countries,
    currentCountry,
    capitalOptions,
    score,
    playerName,
    setPlayerName,
    gameMode,
    setGameMode,
    timeLeft,
    hintLetters,
    leaderboard,
    gameStarted,
    loading,
    error,
    message,
    iniciarJuego,
    responder,
    usarPista,
    reiniciarJuego,
    salirJuego,
    leaderboardPaises,
    leaderboardCapitales,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame debe usarse dentro de GameProvider.');
  }

  return context;
}
