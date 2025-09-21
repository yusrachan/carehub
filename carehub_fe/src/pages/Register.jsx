import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { useTranslation } from "react-i18next";

/**
 * Champ personnalisé pour le mot de passe.
 * - Inclut un bouton "afficher/masquer".
 * - Évalue la force du mot de passe (longueur, majuscule, minuscule, chiffre, caractère spécial).
 */

function PasswordField({ register, error }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false)
  const [score, setScore] = useState(0)

  /**
   * Évalue la force du mot de passe en incrémentant un score.
   * @param {string} v - Valeur saisie dans le champ mot de passe.
   */
  const evalStrength = (v) => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    setScore(s)
  }

  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-1">{t("password")}</label>
      <div className="relative">
        <input
          {...register("password", { onChange: (e) => evalStrength(e.target.value) })}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
          aria-invalid={!!error}/>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600">
          {show ? t("hide") : t("show")}
        </button>
      </div>
      <div className="mt-1 h-1 rounded bg-gray-200 overflow-hidden">
        <div
          className={`h-full transition-all ${
            ["w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"][Math.max(0, score - 1)]
          } bg-green-600`}/>
      </div>
      <p className="text-xs text-gray-600 mt-1">{t("password_requirements")}</p>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  )
}

/**
 * Champ numérique personnalisé (NISS, INAMI, BCE, etc.).
 * - Supprime les caractères non numériques.
 * - Limite la saisie à un nombre de chiffres donné.
 */
function NumericField({ name, label, digits = 11, register, error }) {
  const { t } = useTranslation();
  return(
    <div className="mb-4">
      <label className="block text-gray-700 mb-1">{label}</label>
      <input
        {...register(name)}
        inputMode="numeric"
        onChange={(e) => {
          e.target.value = e.target.value.replace(/\D/g, "").slice(0, digits);
        }}
        placeholder={`${digits}` + t("digits")}
        className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
        aria-invalid={!!error}/>
      <p className="text-xs text-gray-500 mt-1">{t("enter")} {digits} {t("digits_without_spaces")}</p>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  )
}

/**
 * Page d'inscription.
 * - Contient deux sections : informations utilisateur et informations du cabinet.
 * - Validation avec Yup et React Hook Form.
 * - Soumission via Axios à l’API backend.
 * - Redirige vers Stripe si `checkout_url` est fourni.
 */
export default function Register() {
  const { t } = useTranslation();
  const schema = yup.object().shape({
      name: yup.string().required(t("first_name_required")),
      surname: yup.string().required(t("surname_required")),
      niss: yup.string().matches(/^\d{11}$/, t("niss_invalid")).required(t("niss_required")),
      inami: yup.string().matches(/^\d{11}$/, t("inami_invalid")).required(t("inami_required")),
      email: yup.string().email(t("email_invalid")).required(t("email_required")),
      password: yup.string().min(8, t("password_min")).required(t("password_required")),

      office_name: yup.string().required(t("office_name_required")),
      bce_number: yup
      .string()
      .matches(/^\d{10}$/, t("bce_number_invalid"))
      .required(t("bce_number_required")),
      street: yup.string().required(t("street_required")),
      number_street: yup
      .string()
      .matches(/^\d+$/, t("number_street_invalid"))
      .required(t("number_street_required")),
      box: yup.string().nullable(),
      zipcode: yup
      .string()
      .matches(/^\d{4,5}$/, t("zipcode_invalid"))
      .required(t("zipcode_required")),
      city: yup.string().required(t("city_required")),
  });

  const navigate = useNavigate()
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState("")
  
  /**
   * Soumet le formulaire au backend.
   * - Sauvegarde les tokens dans localStorage.
   * - Définit l’en-tête Authorization par défaut pour Axios.
   * - Redirige vers Stripe si `checkout_url` existe.
   * - Sinon, redirige vers les paramètres d’abonnement.
   */
  const onSubmit = async (form) => {
    setGlobalError("")
    setLoading(true)
    try {
      const res = await axios.post("/api/register-full-account/", form)
      const { access, refresh, checkout_url } = res.data

      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
      axios.defaults.headers.common.Authorization = `Bearer ${access}`

      if(checkout_url) {
        window.location.replace(checkout_url)
        return
      }
      navigate("/settings?tab=subscription")
    } catch (err) {
      // Gestion des erreurs renvoyées par l’API
      const server= err?.response?.data
      if (server && typeof server === "object") {
        let hasField = false
        for (const [field, message] of Object.entries(server)) {
          hasField = true
          setError(field, { type: "server", message: String(message) });
        };
        if (!hasField) setGlobalError(t("generic_error"));
      } else {
        setGlobalError(typeof server === "string" ? server : t("server_error"));
      }
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="flex w-screen min-h-screen items-center justify-center bg-[#D9E1E8] py-16 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl"
        noValidate>
        <h2 className="text-2xl text-center font-bold text-[#466896] mb-6">{t("create_account")}</h2>

        {globalError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
            {globalError}
          </div>
        )}

        <fieldset className="mb-6">
          <legend className="text-lg font-semibold mb-4">{t("user_information")}</legend>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">{t("first_name")}</label>
              <input
                {...register("name")}
                type="text"
                autoComplete="given-name"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.name}/>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-1">{t("last_name")}</label>
              <input
                {...register("surname")}
                type="text"
                autoComplete="family-name"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.surname}/>
              {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname.message}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <NumericField name="niss" label="NISS" digits={11} register={register} error={errors.niss} />
            <NumericField name="inami" label="INAMI" digits={11} register={register} error={errors.inami} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">{t("email")}</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.email}/>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <PasswordField register={register} error={errors.password} />
          </div>
        </fieldset>

        {/* --- Section: Cabinet --- */}
        <fieldset className="mb-6">
          <legend className="text-lg font-semibold mb-4">{t("office_information")}</legend>

          <div className="mb-4">
            <label className="block text-gray-700 mb-1">{t("office_name")}</label>
            <input
              {...register("office_name")}
              type="text"
              className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
              aria-invalid={!!errors.office_name}/>
            {errors.office_name && <p className="text-red-500 text-sm mt-1">{errors.office_name.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <NumericField name="bce_number" label={t("bce_number")} digits={10} register={register} error={errors.bce_number} />
            <div>
              <label className="block text-gray-700 mb-1">{t("box_optional")}</label>
              <input
                {...register("box")}
                type="text"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"/>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">{t("address")}</label>
              <input
                {...register("street")}
                type="text"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.street}/>
              {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-1">{t("street_number")}</label>
              <input
                {...register("number_street")}
                inputMode="numeric"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.number_street}
                onChange={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}/>
              {errors.number_street && <p className="text-red-500 text-sm mt-1">{errors.number_street.message}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">{t("zipcode")}</label>
              <input
                {...register("zipcode")}
                inputMode="numeric"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.zipcode}
                onChange={(e) => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5))}/>
              {errors.zipcode && <p className="text-red-500 text-sm mt-1">{errors.zipcode.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-gray-700 mb-1">{t("city")}</label>
              <input
                {...register("city")}
                type="text"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.city}
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#466896] hover:opacity-95"
          }`}>
          {loading ? <span>{t("creating_account")}</span> : <span>{t("create_account_and_pay")}</span>}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          {t("already_have_account")}{" "}
          <a href="/login" className="text-[#466896] underline">
            {t("login")}
          </a>
        </p>
      </form>
    </div>
  );
}