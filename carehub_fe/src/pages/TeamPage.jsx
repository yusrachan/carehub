import React, { useEffect, useState } from "react";
import { Plus, Search, Grid3X3, List } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
// import { TeamStatsCard } from "../components/TeamStatsCard";
import AddCollaborator from "../components/AddCollaborator"; 

export default function TeamPage({ officeId, userRole }) {
    const [members, setMembers] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [view, setView] = useState("grid")
    const [isAddOpen, setIsAddOpen] = useState(false)

    useEffect(() => {
        fetch(`http://localhost:8000/api/offices/${officeId}/members/`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
        })
            .then(res => {
                if (!res.ok) throw new Error("Non autorisé ou erreur api");
                res.json()
            }) 
            .then(setMembers)
            .catch(() => setMembers([]))
    }, [officeId, isAddOpen])

    const filteredMembers = members.filter(m =>
        (m.name + " " + m.surname + " " + m.email).toLowerCase().includes(searchTerm.toLowerCase())
    )
    return (
        <div className="flex h-screen">
            <div className="flex-1 bg-blue-100 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">
                            Équipe
                        </h1>
                        <p className="text-gray-600">
                            {filteredMembers.length} membre{filteredMembers.length > 1 && "s"}
                        </p>
                    </div>
                    {userRole === "manager" && (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => setIsAddOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un collaborateur
                        </Button>
                    )}
                </div>
            </div>

            <AddCollaborator
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                officeId={officeId} />

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Rechercher un membre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"/>
                </div>
                <div className="flex gap-2">
                    <button
                        className={`px-2 py-1 rounded ${view === "grid" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                        onClick={() => setView("grid")}>
                        <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                        className={`px-2 py-1 rounded ${view === "list" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                        onClick={() => setView("list")}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

        </div>
    )
}