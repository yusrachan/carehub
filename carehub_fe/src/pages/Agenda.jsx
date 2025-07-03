import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";

const AgendaPage = () => {
    const [date, setDate] = useState(new Date())
    const [currentWeek, setCurrentWeek] = useState(new Date())

    const timeSlots = Array.from({ length: 12 }, (_, i)=> { 
        const hour = i + 8
        return `${hour.toString().padStart(2, '0')}:00`
    })

    const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

    const getWeekDates = (startDate) => {
        const date = new Date(startDate)
        const dayOfWeek = date.getDay()
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        date.setDate(date.getDate() + diffToMonday)

        const week = []

        for (let i = 0; i < 7; i++){
            const day = new Date(date)
            day.setDate(date.getDate() + i)
            week.push(day)
        }
        return week
    }

    const weekDates  = getWeekDates(currentWeek)

    const navigateWeek = (direction) => {
        const newWeek = new Date(currentWeek)
        newWeek.setDate(
            newWeek.getDate() + (direction === 'next' ? 7 : -7)
        )
        setCurrentWeek(newWeek)
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Calendrier</h2>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nouveau
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                {/* Mini Calendar */}
                <Card className="w-full md:w-60 flex-shrink-0">
                    <CardHeader>
                        <CardTitle className="text-lg">Calendrier</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-auto">
                        <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="w-full max-w-xs sm:max-w-md mx-auto rounded-md border"
                        />
                    </CardContent>
                </Card>

                {/* Weekly View */}
                <div className="flex-1">
                    <Card className="w-full">
                        <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                            Semaine du {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            </div>
                        </div>
                        </CardHeader>
                        <CardContent>
                        <div className="grid grid-cols-8 gap-1">
                            {/* Time column header */}
                            <div className="p-2"></div>
                            
                            {/* Day headers */}
                            {weekDates.map((date, index) => (
                            <div key={index} className="p-2 text-center font-medium border-b">
                                <div className="text-sm text-muted-foreground">{weekDays[index]}</div>
                                <div className={`text-lg ${date.toDateString() === new Date().toDateString() ? 'text-blue-600 font-bold' : ''}`}>
                                {date.getDate()}
                                </div>
                            </div>
                            ))}

                            {/* Time slots */}
                            {timeSlots.map((time, timeIndex) => (
                            <div key={timeIndex} className="contents">
                                {/* Time label */}
                                <div className="p-2 text-sm text-muted-foreground border-r">
                                {time}
                                </div>
                                
                                {/* Day cells */}
                                {weekDates.map((date, dayIndex) => (
                                <div key={`${timeIndex}-${dayIndex}`} className="p-1 min-h-[60px] border-r border-b relative hover:bg-muted/50 cursor-pointer">
                                    {/* Show appointments for current day and time */}
                                    {timeIndex === 1 && dayIndex === 1 && (
                                    <div className="absolute inset-1 bg-blue-500 text-white text-xs p-1 rounded">
                                        <div className="font-medium">Marie Dubois</div>
                                        <div>Rééducation</div>
                                    </div>
                                    )}
                                    {timeIndex === 2 && dayIndex === 1 && (
                                    <div className="absolute inset-1 bg-green-500 text-white text-xs p-1 rounded">
                                        <div className="font-medium">Jean Martin</div>
                                        <div>Consultation</div>
                                    </div>
                                    )}
                                </div>
                                ))}
                            </div>
                            ))}
                        </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}

export default AgendaPage