// Textos externalizados. pt-PT (grafia pré-Acordo) é a língua por defeito; outras línguas
// entram como novos ficheiros em src/i18n/ e config/i18n/<língua>/reasons.json.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import reasons from "../../../config/i18n/pt-PT/reasons.json";
import ui from "./pt-PT.json";

void i18n.use(initReactI18next).init({
  lng: "pt-PT",
  fallbackLng: "pt-PT",
  defaultNS: "ui",
  ns: ["ui", "reasons"],
  resources: { "pt-PT": { ui, reasons } },
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
