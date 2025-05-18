import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

const schema = yup.object().shape({
    name: yup.string().required("Nom requis"),
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
    email: yup.string().email("E-mail invalide").required("E-mail requis"),
    phone: yup.string().required("Téléphone requis"),
});

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <div className="flex flex-col w-screen items-center justify-center bg-[#D9E1E8] py-20">
        <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
            <h2 className="text-2xl text-center font-bold text-[#466896] mb-4">Inscription de votre cabinet</h2>

            {[
            { label: "Nom du cabinet", name: "name" },
            { label: "Numéro BCE", name: "bce_number" },
            { label: "Adresse", name: "street" },
            { label: "N°", name: "number_street" },
            { label: "Boîte (optionnel)", name: "box" },
            { label: "Code postal", name: "zipcode" },
            { label: "Ville", name: "city" },
            { label: "Email", name: "email" },
            { label: "Téléphone", name: "phone" },
            ].map(({ label, name }) => (
            <div className="mb-4" key={name}>
                <label className="block text-gray-700 mb-2">{label}</label>
                <input 
                {...register(name)}
                className="w-full px-4 py-2 border rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#466896]" 
                type="text"
                />
                {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]?.message}</p>}
            </div>
            ))}

            <button 
            type="submit" 
            className="w-full bg-[#466896] text-white py-2 rounded-lg hover:bg-[#3b5a75] transition">
            S'inscrire
            </button>
        </form>
    </div>
  );
}