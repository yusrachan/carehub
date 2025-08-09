import React, { useState } from "react";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UserCog, Users } from "lucide-react";

export default function InviteMemberDialog({ isOpen, onClose, officeId, onSuccess }) {
    const [selectedRole, setSelectedRole] = useState(null)
    const handleClose = () => {
        setSelectedRole(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2x1">
                {!selectedRole ? (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-center">Inviter un collaborateur</h2>
                            <p className="text-gray-600 text-center mt-2">
                                Choisissez le type de collaborateur à inviter dans votre cabinet
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                        <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                            onClick={() => setSelectedRole("practitioner")}>
                            <CardHeader className="text-center">
                                <UserCog className="w-12 h-12 mx-auto text-primary mb-2" />
                                <CardTitle>Kinésithérapeute</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 text-center">
                                    Ajouter un kinésithérapeute par numéro INAMI
                                </p>
                            </CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                            onClick={() => setSelectedRole("secretary")}>
                            <CardHeader className="text-center">
                                <Users className="w-12 h-12 mx-auto text-primary mb-2" />
                                <CardTitle>Secrétaire</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 text-center">
                                    Ajouter une secrétaire par e-mail
                                </p>
                            </CardContent>
                        </Card>
                        </div>
                        <div className="flex justify-center">
                        <Button variant="outline" onClick={handleClose}>
                            Annuler
                        </Button>
                        </div>
                    </div>
                    ) : selectedRole === "practitioner" ? (
                        <InvitePractitionerForm officeId={officeId} onClose={handleClose} onSuccess={onSuccess} />
                    ) : (
                        <InviteSecretaryForm officeId={officeId} onClose={handleClose} onSuccess={onSuccess} />
                    )}
            </DialogContent>
        </Dialog>
    )
}