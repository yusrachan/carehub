import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr.json";
import nl from "./locales/nl.json";

i18n.use(initReactI18next).init({
    resources: {
        fr: { translation: fr },
        nl: { translation: nl },
    },
    lng: localStorage.getItem("lang") || "fr",
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
});

export default i18n;
