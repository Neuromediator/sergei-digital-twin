// UI translations + locale helpers. Add/adjust strings here.
// The twin's ANSWER language is driven by the selected locale (see lib/systemPrompt.ts);
// these strings localize the interface chrome (greeting, chips, buttons, errors).

export const LOCALES = ["en", "et", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

// Human name for the model's response-language instruction.
export const LANGUAGE_NAME: Record<Locale, string> = {
  en: "English",
  et: "Estonian",
  ru: "Russian",
};

export type Strings = {
  languageLabel: string; // native name shown in the toggle menu
  title: string;
  greeting: string;
  suggestedQuestions: string[];
  inputPlaceholder: string;
  clear: string;
  clearTitle: string;
  online: string;
  send: string;
  languageMenu: string; // aria-label for the toggle
  moreMenu: string; // aria-label for the mobile overflow (⋯) menu
  errorRateLimit: string;
  errorGeneric: string;
  errorNetwork: string;
};

export const STRINGS: Record<Locale, Strings> = {
  en: {
    languageLabel: "English",
    title: "LLM Engineer / AI Practitioner",
    greeting: "Hi there! I am Sergei. Feel free to ask me anything about my work!",
    suggestedQuestions: [
      "Tell me about your background and experience.",
      "What kinds of projects are you working on now?",
      "What are your strongest technical skills?",
      "How can I get in touch with you?",
    ],
    inputPlaceholder: "Type your message...",
    clear: "Clear",
    clearTitle: "Clear chat",
    online: "online",
    send: "Send message",
    languageMenu: "Change language",
    moreMenu: "More options",
    errorRateLimit: "You're sending messages too fast. Please wait a moment.",
    errorGeneric: "Something went wrong. Please try again.",
    errorNetwork: "Network error — please check your connection and try again.",
  },
  et: {
    languageLabel: "Eesti",
    title: "LLM-insener / AI-praktik",
    greeting: "Tere! Olen Sergei. Küsi minult julgelt minu töö kohta!",
    suggestedQuestions: [
      "Räägi oma taustast ja kogemusest.",
      "Milliste projektidega sa praegu tegeled?",
      "Millised on sinu tugevaimad tehnilised oskused?",
      "Kuidas saan sinuga ühendust võtta?",
    ],
    inputPlaceholder: "Kirjuta oma sõnum...",
    clear: "Tühjenda",
    clearTitle: "Tühjenda vestlus",
    online: "võrgus",
    send: "Saada sõnum",
    languageMenu: "Muuda keelt",
    moreMenu: "Rohkem valikuid",
    errorRateLimit: "Saadad sõnumeid liiga kiiresti. Palun oota hetk.",
    errorGeneric: "Midagi läks valesti. Palun proovi uuesti.",
    errorNetwork: "Võrguviga — kontrolli ühendust ja proovi uuesti.",
  },
  ru: {
    languageLabel: "Русский",
    title: "LLM-инженер / AI-практик",
    greeting: "Привет! Я Сергей. Спрашивайте меня о моей работе!",
    suggestedQuestions: [
      "Расскажите о своём опыте и профессиональном пути.",
      "Над какими проектами вы сейчас работаете?",
      "Каковы ваши сильнейшие технические навыки?",
      "Как с вами связаться?",
    ],
    inputPlaceholder: "Введите сообщение...",
    clear: "Очистить",
    clearTitle: "Очистить чат",
    online: "в сети",
    send: "Отправить сообщение",
    languageMenu: "Сменить язык",
    moreMenu: "Ещё",
    errorRateLimit: "Вы отправляете сообщения слишком часто. Пожалуйста, подождите немного.",
    errorGeneric: "Что-то пошло не так. Попробуйте ещё раз.",
    errorNetwork: "Ошибка сети — проверьте подключение и попробуйте снова.",
  },
};

// Best-effort detection from a browser language tag (e.g. "et-EE", "ru", "en-US").
export function detectLocale(navigatorLanguage: string | undefined | null): Locale {
  const tag = (navigatorLanguage || "").toLowerCase();
  if (tag.startsWith("et")) return "et";
  if (tag.startsWith("ru")) return "ru";
  return "en";
}
