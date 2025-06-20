import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, ArrowRight } from "lucide-react";

export default function SignUpChoiceForm() {
    const navigate = useNavigate()

    const goCreate = () => navigate("/register")
    const goJoin = () => navigate("/register-join")
    const goLogin = () => navigate("/login")

    return(
        <div className="flex items-center justify-center w-screen h-screen bg-[#f0f4f8] p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Créer un compte</CardTitle>
                    <CardDescription>Choisissez votre mode d'inscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={goCreate} variant="outline" className="w-full p-6 flex items-center justify-between">
                        <User className="w-8 h-8 text-blue-600" />
                        <div className="text-center">
                            <div className="font-semibold">Se lancer</div>
                            <div className="text-sm text-gray-500">
                                Créer un cabinet ou exercer en indépendant
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                    </Button>

                    <Button onClick={goJoin} variant="outline" className="w-full p-6 flex items-center justify-between">
                        <Users className="w-8 h-8 text-green-600" />
                        <div className="text-center">
                            <div className="font-semibold">Rejoindre un cabinet</div>
                            <div className="text-sm text-gray-500">
                                Rejoindre un cabinet existant
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                    </Button>

                    <div className="text-center">
                        <Button variant="link" onClick={goLogin} className="text-sm">
                            Déjà un compte ? Se connecter
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}