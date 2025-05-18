import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object().shape({
    email: yup.string().email("Email invalide").required("Email requis"),
    password: yup.string().min(7, "Minimum 7 caractères").required("Mot de passe requis"),
});

export default function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = (data) => {
        console.log("Données du formulaire : ", data)
    };

    return(
        <div className="flex items-center justify-center w-screen h-screen bg-[#D9E1E8]">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-[#466896] mb-6 text-center">Connexion</h2>

                <div className="mb-4">
                <label className="block text-[#333] mb-2" htmlFor="email">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    {...register("email")}
                    className="w-full px-4 py-2 border rounded-lg text-gray-800 bg-white focus focus:outline-none focus:ring-2 focus:ring-[#466896]"/>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div className="mb-6">
                <label className="block text-[#333] mb-2" htmlFor="password">
                    Mot de passe
                </label>
                <input
                    type="password"
                    id="password"
                    {...register("password")}
                    className="w-full px-4 py-2 border rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#466896]"/>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <button
                type="submit"
                className="w-full bg-[#466896] text-white py-2 rounded-lg hover:bg-[#3a5870] transition">
                Se connecter
                </button>
            </form>
        </div>
  );
}