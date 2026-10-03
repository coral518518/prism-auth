// Client-only i18n init. Server-side rendering uses createServerI18n
// from ./init.ts (which omits the browser language detector).

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { RESOURCES, SUPPORTED_LNGS } from "./init";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: RESOURCES,
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LNGS],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
