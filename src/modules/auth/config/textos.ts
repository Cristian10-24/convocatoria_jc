// Textos del inicio de sesión y del panel provisional. El panel usa siempre tuteo (lo leen solo los equipos).

export const TEXTOS_AUTH = {
  tituloLogin: "Panel de la convocatoria",
  subtituloLogin: "Ingresa con tu usuario del equipo.",
  usuario: "Usuario",
  clave: "Contraseña",
  entrar: "Entrar",
  entrando: "Entrando…",
  salir: "Cerrar sesión",
  saliendo: "Cerrando…",
  // Un único mensaje para clave incorrecta, usuario inexistente y usuario inactivo: no revela cuál fue.
  credenciales: "Usuario o contraseña incorrectos.",
  limite: "Demasiados intentos fallidos. Espera unos minutos e intenta otra vez.",
  error: "No pudimos iniciar sesión. Intenta otra vez en un momento.",
  bienvenida: "Hola, {nombre}",
  rol: "Rol",
  paises: "Países",
  sinPaises: "Sin países asignados: no verás inscripciones hasta que te asignen uno.",
  todosLosPaises: "Todos",
  panelPendiente: "El tablero y la lista de inscritos llegan en la siguiente fase.",
} as const;

export const MENSAJES_AUTH = {
  usuarioFormato: "Usuario: de 3 a 40 caracteres, solo letras minúsculas, números, punto, guion o guion bajo.",
  usuarioObligatorio: "Escribe tu usuario.",
  claveObligatoria: "Escribe tu contraseña.",
  claveCorta: "La contraseña debe tener al menos {min} caracteres.",
  claveLarga: "La contraseña es demasiado larga (máximo {max} bytes).",
  nombre: "Escribe el nombre completo (3 a 80 caracteres).",
  paisesCoordinador: "Un coordinador necesita al menos un país.",
  propio: "No puedes quitarte tu propio rol de administración ni desactivarte.",
  ultimoAdmin: "Debe quedar al menos un administrador activo.",
  duplicado: "Ya existe un usuario con ese nombre de usuario.",
  noEncontrado: "El usuario no existe.",
} as const;
