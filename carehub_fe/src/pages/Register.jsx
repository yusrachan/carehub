import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ArrowLeft, Building, User, Users } from "lucide-react";
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
    plan: yup
    .string()
    .oneOf(
        ["petit_cabinet", "moyen_cabinet", "grand_cabinet"], "Plan invalide"
    )
    .required("Plan requis"),
});

export default function Register() {
  const navigate = useNavigate()
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  
  const onSubmit = async (data) => {
    try {
      const res = await axios.post("/api/register-full-account/", data)
      localStorage.setItem("access_token", res.data.access)
      localStorage.setItem("refresh_token", res.data.refresh)
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`
      navigate("/dashboard")
    } catch (err) {
      const serverErrors = err?.response?.data || {}
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field, { type: "server", message })
      })
    }
  };

  return (
    <div className="flex w-screen min-h-screen items-center justify-center bg-[#D9E1E8] py-20">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
            <h2 className="text-2xl text-center font-bold text-[#466896] mb-4">Créer un compte</h2>

            <fieldset className="mb-6">
              <legend className="text-lg font-semibold mb-4">Informations utilisateur</legend>
              {[
                { label: "Prénom", name: "name", type: "text" },
                { label: "Nom", name: "surname", type: "text" },
                { label: "NISS", name: "niss", type: "text" },
                { label: "INAMI", name: "inami", type: "text" },
                { label: "E-mail", name: "email", type: "email" },
                { label: "Mot de passe", name: "password", type: "password" },
              ].map(({ label, name, type }) => (
                <div className="mb-4" key={name}>
                  <label className="block text-gray-700 mb-1">{label}</label>
                  <input {...register(name)} type={type} className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]" />
                  {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>}
                </div>
              ))}
            </fieldset>

            <fieldset className="mb-6">
              <legend className="text-lg font-semibold mb-4">Informations cabinet</legend>
              {[
                { label: "Nom du cabinet", name: "office_name" },
                { label: "Numéro BCE", name: "bce_number" },
                { label: "Adresse", name: "street" },
                { label: "N° de rue", name: "number_street" },
                { label: "Boîte (opt.)", name: "box" },
                { label: "Code postal", name: "zipcode" },
                { label: "Ville", name: "city" },
              ].map(({ label, name }) => (
                <div className="mb-4" key={name}>
                  <label className="block text-gray-700 mb-1">{label}</label>
                  <input {...register(name)} type="text" className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]" />
                  {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>}
                </div>
              ))}
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Plan d’abonnement</label>
                <select {...register("plan")} className="w-full p-2 bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-[#466896]">
                  <option value="">Sélectionnez un plan</option>
                  <option value="petit_cabinet">Cabinet de 1 à 3 praticiens: 30€</option>
                  <option value="moyen_cabinet">Cabinet de 4 à 10 praticiens: 70€</option>
                  <option value="grand_cabinet">Cabinet de plus de 11 praticiens: 120€</option>
                </select>
                {errors.plan && <p className="text-red-500 text-sm mt-1">{errors.plan.message}</p>}
              </div>
            </fieldset>


        <button type="submit" className="w-full bg-[#466896] text-white py-2 rounded-lg">Suivant</button>
      </form>
    </div>
  );
}