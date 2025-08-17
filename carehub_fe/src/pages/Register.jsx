import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

const schema = yup.object().shape({
    name: yup.string().required("Prénom requis"),
    surname: yup.string().required("Nom requis"),
    niss: yup.string().matches(/^\d{11}$/, "Le NISS doit contenir 11 chiffres").required("NISS requis"),
    inami: yup.string().matches(/^\d{11}$/, "L’INAMI doit contenir 11 chiffres").required("INAMI requis"),
    email: yup.string().email("E-mail invalide").required("E-mail requis"),
    password: yup.string().min(7, "Minimum 7 caractères").required("Mot de passe requis"),

    office_name: yup.string().required("Nom du cabinet requis"),
    bce_number: yup
    .string()
    .matches(/^\d{10}$/, "Le numéro BCE doit comporter 10 chiffres")
    .required("BCE requis"),
    street: yup.string().required("Adresse requise"),
    number_street: yup
    .string()
    .matches(/^\d+$/, "Le numéro de rue doit être numérique")
    .required("N° de rue requis"),
    box: yup.string().nullable(),
    zipcode: yup
    .string()
    .matches(/^\d{4,5}$/, "Le code postale doit comporter 4 ou 5 chiffres")
    .required("N° de rue requis"),
    city: yup.string().required("Ville requise"),
});

function PasswordField({ register, error }) {
  const [show, setShow] = useState(false)
  const [score, setScore] = useState(0)

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
      <label className="block text-gray-700 mb-1">Mot de passe</label>
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
          {show ? "Masquer" : "Afficher"}
        </button>
      </div>
      <div className="mt-1 h-1 rounded bg-gray-200 overflow-hidden">
        <div
          className={`h-full transition-all ${
            ["w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"][Math.max(0, score - 1)]
          } bg-green-600`}/>
      </div>
      <p className="text-xs text-gray-600 mt-1">8+ caractères, avec majuscules, chiffres et symbole.</p>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  )
}

function NumericField({ name, label, digits = 11, register, error }) {
  return(
    <div className="mb-4">
      <label className="block text-gray-700 mb-1">{label}</label>
      <input
        {...register(name)}
        inputMode="numeric"
        onChange={(e) => {
          e.target.value = e.target.value.replace(/\D/g, "").slice(0, digits);
        }}
        placeholder={`${digits} chiffres`}
        className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
        aria-invalid={!!error}/>
      <p className="text-xs text-gray-500 mt-1">Saisir {digits} chiffres sans espaces</p>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState("")
  
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
      const server= err?.response?.data
      if (server && typeof server === "object") {
        let hasField = false
        for (const [field, message] of Object.entries(server)) {
          hasField = true
          setError(field, { type: "server", message: String(message) });
        };
        if (!hasField) setGlobalError("Une erreur est survenue. Réessayez.")
      } else {
        setGlobalError(typeof server === "string" ? server : "Erreur serveur (500).");
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
        <h2 className="text-2xl text-center font-bold text-[#466896] mb-6">Créer un compte</h2>

        {globalError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
            {globalError}
          </div>
        )}

        {/* --- Section: Utilisateur --- */}
        <fieldset className="mb-6">
          <legend className="text-lg font-semibold mb-4">Informations utilisateur</legend>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Prénom</label>
              <input
                {...register("name")}
                type="text"
                autoComplete="given-name"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.name}/>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Nom</label>
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
              <label className="block text-gray-700 mb-1">E-mail</label>
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
          <legend className="text-lg font-semibold mb-4">Informations cabinet</legend>

          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Nom du cabinet</label>
            <input
              {...register("office_name")}
              type="text"
              className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
              aria-invalid={!!errors.office_name}/>
            {errors.office_name && <p className="text-red-500 text-sm mt-1">{errors.office_name.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <NumericField name="bce_number" label="Numéro BCE" digits={10} register={register} error={errors.bce_number} />
            <div>
              <label className="block text-gray-700 mb-1">Boîte (opt.)</label>
              <input
                {...register("box")}
                type="text"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"/>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Adresse</label>
              <input
                {...register("street")}
                type="text"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.street}/>
              {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-1">N° de rue</label>
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
              <label className="block text-gray-700 mb-1">Code postal</label>
              <input
                {...register("zipcode")}
                inputMode="numeric"
                className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]"
                aria-invalid={!!errors.zipcode}
                onChange={(e) => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5))}/>
              {errors.zipcode && <p className="text-red-500 text-sm mt-1">{errors.zipcode.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-gray-700 mb-1">Ville</label>
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
          {loading ? "Création du compte…" : "Créer mon compte et payer"}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Déjà un compte ?{" "}
          <a href="/login" className="text-[#466896] underline">
            Se connecter
          </a>
        </p>
      </form>
    </div>
  );
}