import type { Dictionary } from "./en";

/**
 * Hindi strings.
 *
 * Typed as `Dictionary`, so this file cannot drift from `en.ts` — a missing or
 * misspelled key is a build error, not a half-translated screen (AD-11).
 *
 * Written for the everyday Hindi spoken in a UAE cafeteria rather than formal
 * literary Hindi: common loanwords stay ("ऑर्डर", "मेन्यू") because that is what
 * the person reading the screen actually says.
 */
export const hi: Dictionary = {
  brand: {
    name: "MyMenu",
    tagline: "आपके रेस्टोरेंट का अपना ऑर्डर पेज।",
  },

  common: {
    email: "ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड दोबारा डालें",
    restaurantName: "रेस्टोरेंट का नाम",
    signIn: "साइन इन करें",
    signUp: "खाता बनाएँ",
    signOut: "साइन आउट करें",
    saving: "सेव हो रहा है",
    back: "वापस",
    support: "मदद",
    settings: "सेटिंग्स",
    account: "आपका खाता",
  },

  auth: {
    signupTitle: "मुफ़्त शुरू करें",
    signupSubtitle: "सेट करने में दो मिनट। न कार्ड चाहिए, न कुछ इंस्टॉल करना है।",
    loginTitle: "साइन इन करें",
    loginSubtitle: "वापस स्वागत है।",
    haveAccount: "पहले से खाता है?",
    noAccount: "यहाँ नए हैं?",
    forgotLink: "पासवर्ड भूल गए?",

    forgotTitle: "पासवर्ड रीसेट करें",
    forgotSubtitle:
      "अपना ईमेल दीजिए, हम नया पासवर्ड बनाने का लिंक भेज देंगे।",
    forgotSubmit: "लिंक भेजें",
    forgotSent:
      "अगर उस ईमेल पर खाता है तो लिंक भेज दिया गया है। लिंक एक बार चलता है और एक घंटे में खत्म हो जाता है।",

    resetTitle: "नया पासवर्ड बनाएँ",
    resetSubmit: "नया पासवर्ड सेव करें",
    resetDone: "पासवर्ड बदल गया। बाकी सब डिवाइस से साइन आउट कर दिया गया है।",

    errors: {
      emailTaken: "उस ईमेल पर खाता पहले से है — साइन इन कर लें?",
      passwordTooShort: "कम से कम 8 अक्षर रखें।",
      passwordMismatch: "दोनों पासवर्ड अलग हैं।",
      restaurantNameRequired: "अपने रेस्टोरेंट का नाम बताइए।",
      emailInvalid: "यह ईमेल पते जैसा नहीं लग रहा।",
      badCredentials: "यह ईमेल और पासवर्ड आपस में मेल नहीं खाते।",
      linkExpired: "वह लिंक खत्म हो चुका है। नया माँग लीजिए।",
      alreadySetUp: "इस खाते के साथ पहले से एक रेस्टोरेंट है।",
      noRestaurant:
        "यह खाता किसी रेस्टोरेंट का हिस्सा नहीं है। मालिक से कहिए कि आपको जोड़ दें।",
      generic: "हमारी तरफ़ कुछ गड़बड़ हो गई। दोबारा कोशिश कीजिए।",
    },
  },

  roles: {
    owner: "मालिक",
    staff: "रसोई",
    driver: "ड्राइवर",
  },

  dashboard: {
    title: "आज",
    emptyTitle: "अभी कोई ऑर्डर नहीं।",
    emptyAction: "अपनी पहली डिश जोड़ें",
  },

  kitchen: {
    title: "ऑर्डर",
    empty: "कोई चालू ऑर्डर नहीं।",
  },

  deliveries: {
    title: "डिलीवरी",
    empty: "कोई डिलीवरी नहीं दी गई।",
  },

  forbidden: {
    title: "यह पेज आपका नहीं है।",
    body: "आपके खाते को MyMenu के इस हिस्से तक पहुँच नहीं है।",
    backToWork: "अपनी स्क्रीन पर वापस जाएँ",
  },

  ordering: {
    closedTitle: "अभी बंद है।",
    opensAt: "{time} बजे खुलेगा।",
    notTakingOrders: "यह रेस्टोरेंट अभी ऑर्डर नहीं ले रहा।",

    currency: "AED",
    soldOut: "खत्म हो गया",
    add: "जोड़ें",
    addNamed: "{dish} जोड़ें",
    oneFewer: "एक {dish} कम",
    oneMore: "एक {dish} और",

    tableLabel: "टेबल {n}",
    menuSections: "मेन्यू के हिस्से",

    itemCountOne: "1 चीज़",
    itemCountTwo: "2 चीज़ें",
    itemCountFew: "{n} चीज़ें",
    itemCountMany: "{n} चीज़ें",
    orderButton: "ऑर्डर करें",

    backToMenu: "← मेन्यू पर वापस",
    yourOrder: "आपका ऑर्डर",
    howAreYouGettingIt: "आपको यह कैसे चाहिए?",
    modeDineIn: "मैं टेबल पर हूँ",
    modePickup: "मैं खुद ले जाऊँगा",
    modeDelivery: "घर भेज दीजिए",

    tableNumber: "टेबल नंबर",
    whereToBring: "कहाँ पहुँचाना है?",
    addressHint: "बिल्डिंग, फ्लैट नंबर, जो भी मदद करे",
    yourPhone: "आपका फ़ोन नंबर",
    phoneHint: "05x xxx xxxx",
    kitchenNote: "रसोई से कुछ कहना है? (ज़रूरी नहीं)",
    kitchenNoteHint: "प्याज़ नहीं",

    sending: "भेजा जा रहा है…",
    sendToKitchen: "रसोई को भेजें",
    payAtRestaurant: "पैसे आप रेस्टोरेंट में देंगे।",

    shareLocation: "📍 मेरी लोकेशन भेजें",
    findingYou: "आपको ढूँढ रहे हैं…",
    locationShared: "लोकेशन भेज दी गई।",
    locationSharedBody:
      "ड्राइवर को नक्शे पर निशान मिल जाता है, तो उसे रास्ता पूछने के लिए फ़ोन नहीं करना पड़ेगा।",
    checkOnMap: "नक्शे पर देखें",
    removeLocation: "हटा दें",
    locationDenied:
      "आपके फ़ोन ने लोकेशन भेजने से मना कर दिया। कोई बात नहीं — जो पता आप लिखेंगे वही काफ़ी है।",
    locationFailed:
      "हम आपकी लोकेशन नहीं ले पाए। जो पता आप लिखेंगे वही काफ़ी है।",
  },

  orderStatus: {
    orderNumber: "ऑर्डर #{n}",
    atTable: " · टेबल {n}",

    stepReceived: "मिल गया",
    stepCooking: "बन रहा है",
    stepReady: "तैयार",

    receivedTitle: "रसोई को आपका ऑर्डर मिल गया।",
    receivedBody: "वे थोड़ी देर में शुरू कर देंगे।",
    cookingTitle: "अभी बन रहा है।",
    cookingBody: "ज़्यादा देर नहीं लगेगी।",
    readyTitle: "तैयार है।",
    readyBody: "आकर ले जाइए।",
    completedTitle: "हो गया।",
    completedBody: "ऑर्डर करने के लिए शुक्रिया।",
    cancelledTitle: "यह ऑर्डर रद्द कर दिया गया।",
    cancelledBody: "अगर यह आपके लिए हैरानी की बात है तो रेस्टोरेंट से बात कीजिए।",

    keepOpen:
      "इस पेज को खुला रखिए, या इसी लिंक पर वापस आइए। यह 24 घंटे चलता है।",

    notFound: "हमें वह ऑर्डर नहीं मिला।",
    notFoundBody:
      "ऑर्डर के लिंक 24 घंटे बाद काम करना बंद कर देते हैं। अगर आप अभी भी खाने का इंतज़ार कर रहे हैं तो सीधे रेस्टोरेंट से पूछिए।",
  },
};
