import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    role: yup.string().required("Rôle requis"),
    inami: yup.string().when("role", (roleValue, schema) => {
      return roleValue === "praticien"
        ? schema
          .matches(/^\d{11}$/, "L’INAMI doit contenir 11 chiffres")
          .required("INAMI requis")
        : schema.notRequired();
    }),
    email: yup.string().email("E-mail invalide").required("E-mail requis"),
    password: yup.string().min(7, "Minimum 7 caractères").required("Mot de passe requis"),
    choice: yup.string().required("Veuillez choisir une option"),
});

const registrationTypes = [
  {
    id: "cabinet",
    title: "Responsable de Cabinet",
    description: "Créez et gérez votre propre cabinet de kinésithérapie",
    icon: Building,
    color: "blue",
    requiresPayment: true
  },
  {
    id: "indepedent",
    title: "Kinésithérapeute Indépendant",
    description: "Gérez votre pratique en solo",
    icon: User,
    color: "green",
    requiresPayment: true
  },
  {
    id: "employee",
    title: "Rejoindre un Cabinet",
    description: "Rejoignez un cabinet existant sur invitation",
    icon: Users,
    color: "purple",
    requiresPayment: false
  },
]

export default function Register() {
  console.log("Reeegisss rendu")
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  
  const [step, setStep] = useState(1);
  const [accountData, setAccountData] = useState(null);

  const onSubmit = async (data) => {
    console.log("onsub appelé avec ", data)
    setAccountData(data)
    setStep(2)
    // } else if (step === 2) {
    //   try {
    //     await axios.post("/api/office/register-office/", accountData);
    //     navigate("/register-success")
    //   } catch (error) {
    //     if (error.response?.data) {
    //       const serverErrors = error.response.data
    //       Object.keys(serverErrors).forEach((field) => {
    //         setError(field, {type: "server", message: serverErrors[field]})
    //       })
    //     } else {
    //       navigate("/register-error")
    //     }
    //   }
    // }
  };

  const onError = (errors) => {
    console.log("ONEROOR VALID")
  }

  return (
    <div className="flex flex-col w-screen h-screen items-center justify-center bg-[#D9E1E8] py-20">
        <form 
            onSubmit={handleSubmit(onSubmit, onError)} 
            className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
            <h2 className="text-2xl text-center font-bold text-[#466896] mb-4">Créer un compte</h2>

            {step === 1 && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700">Prénom</label>
                  <input {...register("name")} type="name" className="w-full bg-white text-gray-800 p-2 border rounded-lg" />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700">Nom</label>
                  <input {...register("surname")} type="surname" className="w-full bg-white text-gray-800 p-2 border rounded-lg" />
                  {errors.surname && <p className="text-red-500 text-sm">{errors.surname.message}</p>}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700">NISS</label>
                  <input {...register("niss")} type="niss" className="w-full bg-white text-gray-800 p-2 border rounded-lg" />
                  {errors.niss && <p className="text-red-500 text-sm">{errors.niss.message}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Votre rôle</label>
                  <select
                    {...register("role")}
                    className="w-full px-4 py-2 border rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#466896]"
                  >
                    <option value="manager">Manager</option>
                    <option value="praticien">Kinésithérapeute</option>
                    <option value="secretaire">Secrétaire</option>
                  </select>
                  {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700">INAMI (non requis si vous êtes secrétaire)</label>
                  <input {...register("inami")} type="inami" className="w-full bg-white text-gray-800 p-2 border rounded-lg" />
                  {errors.inami && <p className="text-red-500 text-sm">{errors.inami.message}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700">E-mail</label>
                  <input {...register("email")} type="email" className="w-full bg-white text-gray-800 p-2 border rounded-lg" />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700">Mot de passe</label>
                  <input {...register("password")} type="password" className="w-full bg-white text-gray-800 p-2 border rounded-lg" />
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Choisissez une option ci-dessous</label>
                  <select {...register("choice")} className="w-full bg-white text-gray-800 p-2 border rounded-lg">
                    <option value="create">Je veux créer un cabinet / Je suis indépendant.e</option>
                    <option value="join">Je veux rejoindre un cabinet</option>
                  </select>
                  {errors.choice && <p className="text-red-500 text-sm">{errors.choice.message}</p>}
                </div>

                <button type="submit" className="w-full bg-[#466896] text-white py-2 rounded-lg">Suivant</button>
              </>
            )}

            {step === 2 && accountData?.choice === "create" && (
              <div>
                <p className="text-center text-lg">Tu veux inscrire un cabinet. Redirection vers le formulaire cabinet.</p>
              </div>
            )}

            {step === 2 && accountData?.choice === "join" && (
              <div>
                <p className="text-center text-lg">Tu vas recevoir un lien d'invitation si un cabinet t'ajoute.</p>
              </div>
            )}
        </form>
    </div>
  );
}