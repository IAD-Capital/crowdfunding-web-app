const es = {
  lang: "es",
  home: {
    welcome: "Bienvenido",
    signIn: "Iniciar sesión",
    createAccount: "Crear una cuenta",
    or: "o",
  },
  auth: {
    login: {
      title: "Iniciar sesión",
      email: "Correo electrónico",
      password: "Contraseña",
      submit: "Iniciar sesión",
      loading: "Iniciando sesión…",
      noAccount: "¿No tienes una cuenta?",
      createOne: "Créala aquí",
      error: {
        required: "El correo y la contraseña son obligatorios.",
        invalid: "Correo o contraseña incorrectos.",
        generic: "Error al iniciar sesión.",
      },
    },
    signup: {
      title: "Crear cuenta",
      fullName: "Nombre completo",
      email: "Correo electrónico",
      password: "Contraseña",
      submit: "Crear cuenta",
      loading: "Creando cuenta…",
      haveAccount: "¿Ya tienes una cuenta?",
      signIn: "Inicia sesión",
      checks: {
        length: "Al menos 8 caracteres",
        uppercase: "Letra mayúscula",
        lowercase: "Letra minúscula",
        number: "Número",
        special: "Carácter especial",
      },
      error: {
        required: "Todos los campos son obligatorios.",
        passwordRules: "La contraseña debe tener mayúsculas, minúsculas, número y carácter especial.",
        emailInUse: "El correo ya está en uso.",
        generic: "Error al crear la cuenta.",
      },
    },
    logout: "Cerrar sesión",
  },
} as const;

export default es;
export type Dictionary = typeof es;
