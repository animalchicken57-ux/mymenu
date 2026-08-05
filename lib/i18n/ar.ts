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
    support: "المساعدة",
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
};
