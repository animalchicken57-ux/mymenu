/**
 * English strings. The shape of this file IS the contract — `ar.ts` is typed
 * against it, so a key added here and forgotten there fails the build
 * (architecture.md AD-11).
 *
 * Voice, per EXPERIENCE.md: plain, short, never clever. Errors name the fix,
 * not the fault. No exclamation marks. No "Oops".
 */
export const en = {
  brand: {
    name: "MyMenu",
    tagline: "Your restaurant's own ordering page.",
  },

  common: {
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    restaurantName: "Restaurant name",
    signIn: "Sign in",
    signUp: "Create account",
    signOut: "Sign out",
    saving: "Saving",
    back: "Back",
    support: "Support",
  },

  auth: {
    signupTitle: "Start free",
    signupSubtitle:
      "Two minutes to set up. No card, and nothing to install.",
    loginTitle: "Sign in",
    loginSubtitle: "Welcome back.",
    haveAccount: "Already have an account?",
    noAccount: "New here?",
    forgotLink: "Forgot your password?",

    forgotTitle: "Reset your password",
    forgotSubtitle:
      "Give us your email and we will send you a link to set a new password.",
    forgotSubmit: "Send the link",
    forgotSent:
      "If that email has an account, a reset link is on its way. The link works once, and expires in an hour.",

    resetTitle: "Set a new password",
    resetSubmit: "Save new password",
    resetDone: "Password changed. Every other device has been signed out.",

    errors: {
      emailTaken: "That email already has an account — sign in instead?",
      passwordTooShort: "Use at least 8 characters.",
      passwordMismatch: "The two passwords are different.",
      restaurantNameRequired: "Tell us the name of your restaurant.",
      emailInvalid: "That does not look like an email address.",
      // Deliberately identical for a wrong email and a wrong password, so the
      // form cannot be used to discover which accounts exist.
      badCredentials: "That email and password do not match.",
      linkExpired: "That link has expired. Ask for a new one.",
      alreadySetUp: "This account already has a restaurant.",
      generic: "Something went wrong at our end. Try again.",
    },
  },

  roles: {
    owner: "Owner",
    staff: "Kitchen",
    driver: "Driver",
  },

  dashboard: {
    title: "Today",
    emptyTitle: "No orders yet.",
    emptyAction: "Add your first menu item",
  },

  kitchen: {
    title: "Orders",
    empty: "No active orders.",
  },

  deliveries: {
    title: "Deliveries",
    empty: "No deliveries assigned.",
  },

  forbidden: {
    title: "That page is not yours.",
    body: "Your account does not have access to this part of MyMenu.",
    backToWork: "Back to your screen",
  },
};

// Deliberately not `as const`. With literal types, `ar.ts` would have to repeat
// the English text to type-check, which defeats the point. Widened to `string`,
// the type still enforces the thing that matters: identical key sets (AD-11).
export type Dictionary = typeof en;
