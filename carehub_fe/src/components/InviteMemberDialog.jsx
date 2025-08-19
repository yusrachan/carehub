import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UserCog, Users } from "lucide-react";
import InvitePractitionerForm from "../components/InvitePractitionerForm"
import InviteSecretaryForm from "../components/InviteSecretaryForm"

export default function InviteMemberDialog({ isOpen, onClose, officeId, onSuccess }) {
    const [selectedRole, setSelectedRole] = useState(null)
    const handleClose = () => {
        setSelectedRole(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-2x1">
                {!selectedRole ? (
                    <div className="space-y-6">
                        <DialogTitle className="text-2xl font-bold text-center">
                            Inviter un collaborateur
                        </DialogTitle>
                        <p className="text-gray-600 text-center mt-2">
                            Choisissez le type de collaborateur à inviter
                        </p>
                        <div className="grid gap-4 sm:grid-cols-3">
                        <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                            onClick={() => setSelectedRole("manager")}>
                            <CardHeader className="text-center">
                                <UserCog className="w-12 h-12 mx-auto text-primary mb-2" />
                                <CardTitle>Manager</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 text-center">
                                    Ajouter par numéro INAMI
                                </p>
                            </CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                            onClick={() => setSelectedRole("practitioner")}>
                            <CardHeader className="text-center">
                                <UserCog className="w-12 h-12 mx-auto text-primary mb-2" />
                                <CardTitle>Kinésithérapeute</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 text-center">
                                    Ajouter par numéro INAMI
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
                                    Ajouter par e-mail
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
                    ) : selectedRole === "practitioner" || selectedRole === "manager"? (
                        <InvitePractitionerForm officeId={officeId} role={selectedRole} onClose={handleClose} onSuccess={onSuccess} />
                    ) : (
                        <InviteByEmailForm officeId={officeId} role="secretary" onClose={handleClose} onSuccess={onSuccess} />                        
                    )}
            </DialogContent>
        </Dialog>
    )
}