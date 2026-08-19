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
    // "Help", not "Support": support reads to some people as the kind you give
    // rather than the kind you get, and this link is the second one.
    support: "Help",
    settings: "Settings",
    account: "Your account",
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
      noRestaurant:
        "This account is not part of a restaurant. Ask the owner to add you.",
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

  /**
   * The Diner's whole world — story 7.2 finally reaching the page that matters
   * most. This is the only surface a customer ever sees, and half of them read
   * Arabic first, so it is the first thing translated rather than the last.
   *
   * Every value is a plain string. Placeholders like {n} are filled by
   * lib/i18n/format.ts, and plural forms are chosen there too. It must stay
   * that way: this dictionary crosses into a Client Component, and React
   * cannot serialise a function across that boundary — an earlier version held
   * arrow functions and took the whole ordering page down with a 500.
   */
  ordering: {
    closedTitle: "Closed right now.",
    opensAt: "Opens at {time}.",
    notTakingOrders: "This restaurant isn't taking orders yet.",

    currency: "AED",
    soldOut: "Sold out",
    add: "Add",
    addNamed: "Add {dish}",
    oneFewer: "One fewer {dish}",
    oneMore: "One more {dish}",

    tableLabel: "Table {n}",
    menuSections: "Menu sections",

    itemCountOne: "1 item",
    itemCountTwo: "2 items",
    itemCountFew: "{n} items",
    itemCountMany: "{n} items",
    orderButton: "Order",

    backToMenu: "← Back to the menu",
    yourOrder: "Your order",
    howAreYouGettingIt: "How are you getting it?",
    modeDineIn: "I'm at a table",
    modePickup: "I'll collect it",
    modeDelivery: "Deliver it",

    tableNumber: "Table number",
    whereToBring: "Where should we bring it?",
    addressHint: "Building, flat number, anything that helps",
    yourPhone: "Your phone number",
    phoneHint: "05x xxx xxxx",
    kitchenNote: "Anything to tell the kitchen? (optional)",
    kitchenNoteHint: "No onions",

    sending: "Sending…",
    sendToKitchen: "Send to the kitchen",
    payAtRestaurant: "You pay at the restaurant.",

    shareLocation: "📍 Share my location",
    findingYou: "Finding you…",
    locationShared: "Location shared.",
    locationSharedBody:
      "The driver gets a map pin, so they will not have to phone you for directions.",
    checkOnMap: "Check it on the map",
    removeLocation: "Remove it",
    locationDenied:
      "Your phone said no to sharing location. That is fine — the address you type is enough.",
    locationFailed: "We could not get your location. The address you type is enough.",
  },

  /** The status page a diner watches while the food is cooked — story 3.5. */
  orderStatus: {
    orderNumber: "Order #{n}",
    atTable: " · Table {n}",

    stepReceived: "received",
    stepCooking: "cooking",
    stepReady: "ready",

    receivedTitle: "The kitchen has your order.",
    receivedBody: "They will start it in a moment.",
    cookingTitle: "Cooking now.",
    cookingBody: "It will not be long.",
    readyTitle: "Ready.",
    readyBody: "Come and get it.",
    completedTitle: "All done.",
    completedBody: "Thanks for ordering.",
    cancelledTitle: "This order was cancelled.",
    cancelledBody: "Speak to the restaurant if that is a surprise.",

    keepOpen: "Keep this page open, or come back to this link. It works for 24 hours.",

    notFound: "We can't find that order.",
    notFoundBody:
      "Order links stop working after 24 hours. If you are still waiting on food, ask the restaurant directly.",
  },
};

// Deliberately not `as const`. With literal types, `ar.ts` would have to repeat
// the English text to type-check, which defeats the point. Widened to `string`,
// the type still enforces the thing that matters: identical key sets (AD-11).
export type Dictionary = typeof en;
