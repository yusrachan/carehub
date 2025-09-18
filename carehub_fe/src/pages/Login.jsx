import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { data, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import { api } from "../api";
import { useTranslation } from "react-i18next";


export default function Login() {
    const { t } = useTranslation();
    
    const schema = yup.object().shape({
        email: yup.string().email(t("email.invalid")).required(t("email.required")),
        password: yup.string().min(8, t("password.min")).required(t("password.required")),
    });
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        if (!token) return
        (async () => {
            try {
                if (!localStorage.getItem("current_office_id")){
                    const { data } = await api.get("/offices/my/")
                    if(Array.isArray(data) && data.length){
                        localStorage.setItem("current_office_id", String(data[0].id))
                    }
                }
            } catch (e) {
                console.warn( "Préchargement /offices/my/ impossible: ", e)
            } finally {
                navigate("/dashboard")
            }
        })()
    }, [navigate])

    const { 
        register, handleSubmit, setError, formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (values) => {
        try {
            const res = await axios.post("/api/login/", {
                email: values.email,
                password: values.password,
            })
            localStorage.setItem("access_token", res.data.access)
            localStorage.setItem("refresh_token", res.data.refresh)

            try {
                const { data: offices } = await axios.get("/offices/my/")
                if(Array.isArray(offices) && offices.length){
                    localStorage.setItem("current_office_id", String(offices[0].id))
                } else {
                    localStorage.removeItem("current_office_id")
                }
            } catch (e) {
                console.warn("Chargement de /offices/my/ impossible:", e)
                localStorage.removeItem("current_office_id")
            }
            navigate("/dashboard")
        } catch (err) {
            setError("password", {
                type: "server",
                message: err.response?.status === 401 ? t("invalid_credentials") : t("error_occurred")
            })
        }
    };

    return(
        <div className="flex items-center justify-center w-screen h-screen bg-[#D9E1E8]">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-[#466896] mb-6 text-center">{t("login")}</h2>

                <div className="mb-4">
                <label className="block text-[#333] mb-2" htmlFor="email">
                    {t("email")}
                </label>
                <input
                    type="email"
                    id="email"
                    {...register("email")}
                    className="w-full px-4 py-2 border rounded-lg text-gray-800 bg-white focus focus:outline-none focus:ring-2 focus:ring-[#466896]"/>
                    {errors.email && (<p className="text-red-500 text-sm mt-1">{errors.email.message}</p>)}
                </div>

                <div className="mb-6">
                <label className="block text-[#333] mb-2" htmlFor="password">
                    {t("password")}
                </label>
                <input
                    type="password"
                    id="password"
                    {...register("password")}
                    className="w-full px-4 py-2 border rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#466896]"/>
                    {errors.password && (<p className="text-red-500 text-sm mt-1">{errors.password.message}</p>)}
                </div>

                <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#466896] text-white py-2 rounded-lg hover:bg-[#3a5870] transition">
                    {isSubmitting ? t("login.loading") : t("login")}
                </button>
            </form>
        </div>
    );
}