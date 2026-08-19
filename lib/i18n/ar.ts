import type { Dictionary } from "./en";

/**
 * Arabic strings.
 *
 * Typed as `Dictionary`, so this file cannot drift from `en.ts` — a missing or
 * misspelled key is a build error, not a half-translated screen (AD-11).
 *
 * EXPERIENCE.md: "Arabic is written, not translated." These are written for an
 * Emirati restaurant owner, not machine-converted from the English.
 */
export const ar: Dictionary = {
  brand: {
    name: "ماي مينو",
    tagline: "صفحة طلبات خاصة بمطعمك.",
  },

  common: {
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    restaurantName: "اسم المطعم",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    signOut: "تسجيل الخروج",
    saving: "جارٍ الحفظ",
    back: "رجوع",
    // "المساعدة" وليس "الدعم" — الدعم تُفهم على أنها دعم مالي منك للموقع.
    support: "المساعدة",
    settings: "الإعدادات",
    account: "حسابك",
  },

  auth: {
    signupTitle: "ابدأ مجاناً",
    signupSubtitle: "دقيقتان للإعداد. بدون بطاقة، وبدون تحميل أي شيء.",
    loginTitle: "تسجيل الدخول",
    loginSubtitle: "أهلاً بعودتك.",
    haveAccount: "عندك حساب؟",
    noAccount: "أول مرة معنا؟",
    forgotLink: "نسيت كلمة المرور؟",

    forgotTitle: "استعادة كلمة المرور",
    forgotSubtitle: "اكتب بريدك ونرسل لك رابطاً لتعيين كلمة مرور جديدة.",
    forgotSubmit: "أرسل الرابط",
    forgotSent:
      "إذا كان لهذا البريد حساب، فالرابط في طريقه إليك. يعمل مرة واحدة وينتهي خلال ساعة.",

    resetTitle: "كلمة مرور جديدة",
    resetSubmit: "حفظ كلمة المرور",
    resetDone: "تم تغيير كلمة المرور، وتم تسجيل الخروج من بقية الأجهزة.",

    errors: {
      emailTaken: "هذا البريد له حساب بالفعل — تحب تسجّل الدخول؟",
      passwordTooShort: "استخدم ٨ أحرف على الأقل.",
      passwordMismatch: "كلمتا المرور غير متطابقتين.",
      restaurantNameRequired: "اكتب اسم مطعمك.",
      emailInvalid: "هذا لا يبدو بريداً إلكترونياً.",
      badCredentials: "البريد وكلمة المرور غير متطابقين.",
      linkExpired: "انتهت صلاحية الرابط. اطلب رابطاً جديداً.",
      alreadySetUp: "هذا الحساب مرتبط بمطعم بالفعل.",
      noRestaurant: "هذا الحساب غير مرتبط بأي مطعم. اطلب من المالك إضافتك.",
      generic: "صار خطأ عندنا. حاول مرة ثانية.",
    },
  },

  roles: {
    owner: "المالك",
    staff: "المطبخ",
    driver: "السائق",
  },

  dashboard: {
    title: "اليوم",
    emptyTitle: "ما فيه طلبات بعد.",
    emptyAction: "أضف أول صنف في القائمة",
  },

  kitchen: {
    title: "الطلبات",
    empty: "ما فيه طلبات حالية.",
  },

  deliveries: {
    title: "التوصيل",
    empty: "ما فيه طلبات موكلة لك.",
  },

  forbidden: {
    title: "هذه الصفحة ليست لك.",
    body: "حسابك ما عنده صلاحية لهذا الجزء من ماي مينو.",
    backToWork: "ارجع لشاشتك",
  },

  /**
   * الصفحة اللي يشوفها الزبون. مكتوبة بلهجة خليجية مفهومة، لا فصحى ثقيلة ولا
   * ترجمة حرفية — الزبون واقف على طاولة وما عنده وقت يفك رموز.
   *
   * السهم في backToMenu يتجه يمين لأن الصفحة كلها تنقلب في العربي.
   */
  ordering: {
    closedTitle: "مسكّرين الحين.",
    opensAt: (time: string) => `نفتح الساعة ${time}.`,
    notTakingOrders: "هذا المطعم ما بدأ يستقبل الطلبات بعد.",

    currency: "درهم",
    soldOut: "خلصت",
    add: "أضف",
    addNamed: (dish: string) => `أضف ${dish}`,
    oneFewer: (dish: string) => `واحد أقل من ${dish}`,
    oneMore: (dish: string) => `واحد زيادة من ${dish}`,

    tableLabel: (n: number) => `طاولة ${n}`,
    menuSections: "أقسام المنيو",

    // العربية ما تجمع مثل الإنجليزية: واحد، اثنين، ثم جمع، ثم مفرد بعد العشرة.
    itemCount: (n: number) =>
      n === 1 ? "صنف واحد" : n === 2 ? "صنفين" : n <= 10 ? `${n} أصناف` : `${n} صنف`,
    orderButton: "اطلب",

    backToMenu: "→ رجوع للمنيو",
    yourOrder: "طلبك",
    howAreYouGettingIt: "كيف بتستلم طلبك؟",
    modeDineIn: "أنا على طاولة",
    modePickup: "بمرّ آخذه",
    modeDelivery: "وصّلوه لي",

    tableNumber: "رقم الطاولة",
    whereToBring: "وين نوصّله؟",
    addressHint: "اسم البناية، رقم الشقة، أي شي يساعدنا نوصل",
    yourPhone: "رقم هاتفك",
    phoneHint: "05x xxx xxxx",
    kitchenNote: "شي تبي تقوله للمطبخ؟ (اختياري)",
    kitchenNoteHint: "بدون بصل",

    sending: "جاري الإرسال…",
    sendToKitchen: "أرسل للمطبخ",
    payAtRestaurant: "الدفع في المطعم.",

    shareLocation: "📍 شارك موقعي",
    findingYou: "نحدد موقعك…",
    locationShared: "تم مشاركة الموقع.",
    locationSharedBody: "السائق بيوصله موقعك على الخريطة، فما راح يحتاج يتصل يسأل عن الطريق.",
    checkOnMap: "شوفه على الخريطة",
    removeLocation: "احذفه",
    locationDenied: "هاتفك رفض مشاركة الموقع. عادي — العنوان اللي كتبته يكفي.",
    locationFailed: "ما قدرنا نحدد موقعك. العنوان اللي كتبته يكفي.",
  },

  orderStatus: {
    orderNumber: (n: number) => `طلب رقم ${n}`,
    atTable: (n: number) => ` · طاولة ${n}`,

    stepReceived: "وصل",
    stepCooking: "يُطبخ",
    stepReady: "جاهز",

    receivedTitle: "المطبخ استلم طلبك.",
    receivedBody: "بيبدون فيه بعد شوي.",
    cookingTitle: "يطبخ الحين.",
    cookingBody: "ما راح يطول.",
    readyTitle: "جاهز.",
    readyBody: "تفضل استلمه.",
    completedTitle: "تم.",
    completedBody: "شكراً لطلبك.",
    cancelledTitle: "هذا الطلب انلغى.",
    cancelledBody: "كلّم المطعم إذا هذا شي ما تتوقعه.",

    keepOpen: "خلّ الصفحة مفتوحة، أو ارجع لهذا الرابط. يشتغل ٢٤ ساعة.",

    notFound: "ما لقينا هذا الطلب.",
    notFoundBody:
      "روابط الطلبات تتوقف بعد ٢٤ ساعة. إذا كنت لا تزال تنتظر أكلك، كلّم المطعم مباشرة.",
  },
};
