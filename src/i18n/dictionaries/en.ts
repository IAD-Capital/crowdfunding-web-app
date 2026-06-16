import type { Dictionary } from "./es";

const en: Dictionary = {
  lang: "en",
  home: {
    welcome: "Welcome",
    signIn: "Sign in",
    createAccount: "Create an account",
    or: "or",
  },
  auth: {
    login: {
      title: "Sign in",
      email: "Email",
      password: "Password",
      submit: "Sign in",
      loading: "Signing in…",
      noAccount: "Don't have an account?",
      createOne: "Create one",
      error: {
        required: "Email and password are required.",
        invalid: "Invalid email or password.",
        generic: "Login failed.",
      },
    },
    signup: {
      title: "Create account",
      fullName: "Full name",
      email: "Email",
      password: "Password",
      submit: "Create account",
      loading: "Creating account…",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
      checks: {
        length: "At least 8 characters",
        uppercase: "Uppercase letter",
        lowercase: "Lowercase letter",
        number: "Number",
        special: "Special character",
      },
      error: {
        required: "All fields are required.",
        passwordRules: "Password must include uppercase, lowercase, number, and special character.",
        emailInUse: "Email already in use.",
        generic: "Signup failed.",
      },
    },
    logout: "Sign out",
  },
};

export default en;
