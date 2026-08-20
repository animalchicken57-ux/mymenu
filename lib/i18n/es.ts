import type { Dictionary } from "./en";

/**
 * Spanish strings.
 *
 * Typed as `Dictionary`, so this file cannot drift from `en.ts` — a missing or
 * misspelled key is a build error, not a half-translated screen (AD-11).
 *
 * Neutral Latin-American Spanish, using "usted" for the diner and plain verbs
 * for the owner. Same voice rule as the English: short, never clever, and the
 * error names the fix rather than the fault.
 */
export const es: Dictionary = {
  brand: {
    name: "MyMenu",
    tagline: "La página de pedidos de su restaurante.",
  },

  common: {
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    restaurantName: "Nombre del restaurante",
    signIn: "Iniciar sesión",
    signUp: "Crear cuenta",
    signOut: "Cerrar sesión",
    saving: "Guardando",
    back: "Volver",
    support: "Ayuda",
    settings: "Ajustes",
    account: "Su cuenta",
  },

  auth: {
    signupTitle: "Empiece gratis",
    signupSubtitle: "Dos minutos para configurarlo. Sin tarjeta y sin instalar nada.",
    loginTitle: "Iniciar sesión",
    loginSubtitle: "Bienvenido de nuevo.",
    haveAccount: "¿Ya tiene una cuenta?",
    noAccount: "¿Es nuevo aquí?",
    forgotLink: "¿Olvidó su contraseña?",

    forgotTitle: "Restablecer su contraseña",
    forgotSubtitle:
      "Déjenos su correo y le enviaremos un enlace para poner una contraseña nueva.",
    forgotSubmit: "Enviar el enlace",
    forgotSent:
      "Si ese correo tiene una cuenta, el enlace ya va en camino. Sirve una sola vez y vence en una hora.",

    resetTitle: "Poner una contraseña nueva",
    resetSubmit: "Guardar la contraseña",
    resetDone: "Contraseña cambiada. Se cerró la sesión en los demás dispositivos.",

    errors: {
      emailTaken: "Ese correo ya tiene una cuenta. ¿Prefiere iniciar sesión?",
      passwordTooShort: "Use al menos 8 caracteres.",
      passwordMismatch: "Las dos contraseñas son distintas.",
      restaurantNameRequired: "Díganos el nombre de su restaurante.",
      emailInvalid: "Eso no parece una dirección de correo.",
      badCredentials: "Ese correo y esa contraseña no coinciden.",
      linkExpired: "Ese enlace venció. Pida uno nuevo.",
      alreadySetUp: "Esta cuenta ya tiene un restaurante.",
      noRestaurant:
        "Esta cuenta no pertenece a ningún restaurante. Pida al dueño que lo agregue.",
      generic: "Algo falló de nuestro lado. Inténtelo otra vez.",
    },
  },

  roles: {
    owner: "Dueño",
    staff: "Cocina",
    driver: "Repartidor",
  },

  dashboard: {
    title: "Hoy",
    emptyTitle: "Todavía no hay pedidos.",
    emptyAction: "Agregue su primer plato",
  },

  kitchen: {
    title: "Pedidos",
    empty: "No hay pedidos activos.",
  },

  deliveries: {
    title: "Entregas",
    empty: "No hay entregas asignadas.",
  },

  forbidden: {
    title: "Esa página no es suya.",
    body: "Su cuenta no tiene acceso a esta parte de MyMenu.",
    backToWork: "Volver a su pantalla",
  },

  ordering: {
    closedTitle: "Cerrado ahora.",
    opensAt: "Abre a las {time}.",
    notTakingOrders: "Este restaurante todavía no recibe pedidos.",

    currency: "AED",
    soldOut: "Agotado",
    add: "Agregar",
    addNamed: "Agregar {dish}",
    oneFewer: "Un {dish} menos",
    oneMore: "Un {dish} más",

    tableLabel: "Mesa {n}",
    menuSections: "Secciones del menú",

    itemCountOne: "1 plato",
    itemCountTwo: "2 platos",
    itemCountFew: "{n} platos",
    itemCountMany: "{n} platos",
    orderButton: "Pedir",

    backToMenu: "← Volver al menú",
    yourOrder: "Su pedido",
    howAreYouGettingIt: "¿Cómo lo va a recibir?",
    modeDineIn: "Estoy en una mesa",
    modePickup: "Paso a recogerlo",
    modeDelivery: "Que me lo lleven",

    tableNumber: "Número de mesa",
    whereToBring: "¿A dónde se lo llevamos?",
    addressHint: "Edificio, número de piso, lo que ayude",
    yourPhone: "Su número de teléfono",
    phoneHint: "05x xxx xxxx",
    kitchenNote: "¿Algo que decirle a la cocina? (opcional)",
    kitchenNoteHint: "Sin cebolla",

    sending: "Enviando…",
    sendToKitchen: "Enviar a la cocina",
    payAtRestaurant: "Usted paga en el restaurante.",

    shareLocation: "📍 Compartir mi ubicación",
    findingYou: "Buscándolo…",
    locationShared: "Ubicación compartida.",
    locationSharedBody:
      "El repartidor recibe un punto en el mapa, así no tiene que llamarlo para pedir indicaciones.",
    checkOnMap: "Verlo en el mapa",
    removeLocation: "Quitarla",
    locationDenied:
      "Su teléfono no permitió compartir la ubicación. No pasa nada: con la dirección que escriba alcanza.",
    locationFailed:
      "No pudimos obtener su ubicación. Con la dirección que escriba alcanza.",
  },

  orderStatus: {
    orderNumber: "Pedido n.º {n}",
    atTable: " · Mesa {n}",

    stepReceived: "recibido",
    stepCooking: "cocinando",
    stepReady: "listo",

    receivedTitle: "La cocina tiene su pedido.",
    receivedBody: "Lo empiezan en un momento.",
    cookingTitle: "Cocinando ahora.",
    cookingBody: "No tardará mucho.",
    readyTitle: "Listo.",
    readyBody: "Venga a recogerlo.",
    completedTitle: "Todo listo.",
    completedBody: "Gracias por su pedido.",
    cancelledTitle: "Este pedido se canceló.",
    cancelledBody: "Hable con el restaurante si no lo esperaba.",

    keepOpen:
      "Deje esta página abierta, o vuelva a este enlace. Sirve por 24 horas.",

    notFound: "No encontramos ese pedido.",
    notFoundBody:
      "Los enlaces de pedido dejan de servir después de 24 horas. Si todavía espera su comida, hable directamente con el restaurante.",
  },
};
