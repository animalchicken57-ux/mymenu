import type { Dictionary } from "./en";

/**
 * German strings.
 *
 * Typed as `Dictionary`, so this file cannot drift from `en.ts` — a missing or
 * misspelled key is a build error, not a half-translated screen (AD-11).
 *
 * "Sie" throughout, for both the owner and the diner. Same voice rule as the
 * English: short, never clever, and the error names the fix, not the fault.
 */
export const de: Dictionary = {
  brand: {
    name: "MyMenu",
    tagline: "Die eigene Bestellseite Ihres Restaurants.",
  },

  common: {
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    restaurantName: "Name des Restaurants",
    signIn: "Anmelden",
    signUp: "Konto erstellen",
    signOut: "Abmelden",
    saving: "Wird gespeichert",
    back: "Zurück",
    support: "Hilfe",
    settings: "Einstellungen",
    account: "Ihr Konto",
  },

  auth: {
    signupTitle: "Kostenlos starten",
    signupSubtitle:
      "Zwei Minuten zum Einrichten. Ohne Karte, und nichts zu installieren.",
    loginTitle: "Anmelden",
    loginSubtitle: "Willkommen zurück.",
    haveAccount: "Sie haben schon ein Konto?",
    noAccount: "Neu hier?",
    forgotLink: "Passwort vergessen?",

    forgotTitle: "Passwort zurücksetzen",
    forgotSubtitle:
      "Geben Sie uns Ihre E-Mail, und wir schicken Ihnen einen Link für ein neues Passwort.",
    forgotSubmit: "Link schicken",
    forgotSent:
      "Wenn zu dieser E-Mail ein Konto gehört, ist der Link unterwegs. Er gilt einmal und läuft nach einer Stunde ab.",

    resetTitle: "Neues Passwort festlegen",
    resetSubmit: "Neues Passwort speichern",
    resetDone: "Passwort geändert. Alle anderen Geräte wurden abgemeldet.",

    errors: {
      emailTaken: "Zu dieser E-Mail gibt es schon ein Konto — lieber anmelden?",
      passwordTooShort: "Nehmen Sie mindestens 8 Zeichen.",
      passwordMismatch: "Die beiden Passwörter sind verschieden.",
      restaurantNameRequired: "Sagen Sie uns den Namen Ihres Restaurants.",
      emailInvalid: "Das sieht nicht nach einer E-Mail-Adresse aus.",
      badCredentials: "Diese E-Mail und dieses Passwort passen nicht zusammen.",
      linkExpired: "Dieser Link ist abgelaufen. Fordern Sie einen neuen an.",
      alreadySetUp: "Zu diesem Konto gehört schon ein Restaurant.",
      noRestaurant:
        "Dieses Konto gehört zu keinem Restaurant. Bitten Sie den Inhaber, Sie hinzuzufügen.",
      generic: "Bei uns ist etwas schiefgegangen. Versuchen Sie es noch einmal.",
    },
  },

  roles: {
    owner: "Inhaber",
    staff: "Küche",
    driver: "Fahrer",
  },

  dashboard: {
    title: "Heute",
    emptyTitle: "Noch keine Bestellungen.",
    emptyAction: "Legen Sie Ihr erstes Gericht an",
  },

  kitchen: {
    title: "Bestellungen",
    empty: "Keine offenen Bestellungen.",
  },

  deliveries: {
    title: "Lieferungen",
    empty: "Keine Lieferungen zugeteilt.",
  },

  forbidden: {
    title: "Diese Seite gehört nicht Ihnen.",
    body: "Ihr Konto hat keinen Zugang zu diesem Teil von MyMenu.",
    backToWork: "Zurück zu Ihrem Bildschirm",
  },

  ordering: {
    closedTitle: "Gerade geschlossen.",
    opensAt: "Öffnet um {time}.",
    notTakingOrders: "Dieses Restaurant nimmt noch keine Bestellungen an.",

    currency: "AED",
    soldOut: "Ausverkauft",
    add: "Hinzufügen",
    addNamed: "{dish} hinzufügen",
    oneFewer: "Ein {dish} weniger",
    oneMore: "Ein {dish} mehr",

    tableLabel: "Tisch {n}",
    menuSections: "Bereiche der Karte",

    itemCountOne: "1 Gericht",
    itemCountTwo: "2 Gerichte",
    itemCountFew: "{n} Gerichte",
    itemCountMany: "{n} Gerichte",
    orderButton: "Bestellen",

    backToMenu: "← Zurück zur Karte",
    yourOrder: "Ihre Bestellung",
    howAreYouGettingIt: "Wie bekommen Sie es?",
    modeDineIn: "Ich sitze am Tisch",
    modePickup: "Ich hole es ab",
    modeDelivery: "Bitte liefern",

    tableNumber: "Tischnummer",
    whereToBring: "Wohin sollen wir es bringen?",
    addressHint: "Gebäude, Wohnungsnummer, alles was hilft",
    yourPhone: "Ihre Telefonnummer",
    phoneHint: "05x xxx xxxx",
    kitchenNote: "Etwas für die Küche? (optional)",
    kitchenNoteHint: "Ohne Zwiebeln",

    sending: "Wird gesendet…",
    sendToKitchen: "An die Küche senden",
    payAtRestaurant: "Sie zahlen im Restaurant.",

    shareLocation: "📍 Meinen Standort teilen",
    findingYou: "Wir suchen Sie…",
    locationShared: "Standort geteilt.",
    locationSharedBody:
      "Der Fahrer bekommt einen Punkt auf der Karte und muss Sie nicht nach dem Weg fragen.",
    checkOnMap: "Auf der Karte ansehen",
    removeLocation: "Entfernen",
    locationDenied:
      "Ihr Telefon hat das Teilen des Standorts abgelehnt. Das ist in Ordnung — die Adresse, die Sie eintippen, reicht.",
    locationFailed:
      "Wir konnten Ihren Standort nicht ermitteln. Die Adresse, die Sie eintippen, reicht.",
  },

  orderStatus: {
    orderNumber: "Bestellung Nr. {n}",
    atTable: " · Tisch {n}",

    stepReceived: "eingegangen",
    stepCooking: "wird gekocht",
    stepReady: "fertig",

    receivedTitle: "Die Küche hat Ihre Bestellung.",
    receivedBody: "Sie fangen gleich damit an.",
    cookingTitle: "Wird gerade gekocht.",
    cookingBody: "Es dauert nicht lange.",
    readyTitle: "Fertig.",
    readyBody: "Holen Sie es ab.",
    completedTitle: "Alles erledigt.",
    completedBody: "Danke für Ihre Bestellung.",
    cancelledTitle: "Diese Bestellung wurde storniert.",
    cancelledBody: "Sprechen Sie mit dem Restaurant, falls Sie das überrascht.",

    keepOpen:
      "Lassen Sie diese Seite offen, oder kommen Sie über diesen Link zurück. Er gilt 24 Stunden.",

    notFound: "Wir finden diese Bestellung nicht.",
    notFoundBody:
      "Bestell-Links gelten nur 24 Stunden. Wenn Sie noch auf Ihr Essen warten, fragen Sie direkt im Restaurant.",
  },
};
