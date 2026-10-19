
const URL_BANDERAS =
  'https://countriesnow.space/api/v0.1/countries/flag/images';

const URL_CAPITALES =
  'https://countriesnow.space/api/v0.1/countries/capital';

async function consultar(url) {
  const respuesta = await fetch(url);
  const resultado = await respuesta.json();

  if (!respuesta.ok || resultado.error) {
    throw new Error(resultado.msg || 'Error al consultar la API.');
  }

  return resultado.data;
}

export function obtenerPaises() {
  return consultar(URL_BANDERAS);
}

export function obtenerCapitales() {
  return consultar(URL_CAPITALES);
}
