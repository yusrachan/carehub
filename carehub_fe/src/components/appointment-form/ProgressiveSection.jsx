import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card"; 
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export default function ProgressiveSection({title, icon, isValid, isExpanded, isDisabled = false, onToggle, children }) {
    const [open, setOpen] = useState(isExpanded);

    const handleToggle = () => {
        if (!isDisabled) {
        setOpen((prev) => !prev);
        onToggle && onToggle();
        }
    };

    return (
        <Card className={cn(
        "transition-all duration-300",
        isDisabled && "opacity-50",
        isValid && "ring-2 ring-green-200 border-green-400")}>
            <CardHeader className={cn(
                "flex justify-between items-center cursor-pointer transition-colors",
                isDisabled ? "cursor-not-allowed text-gray-400" : "hover:bg-gray-50")}
                onClick={handleToggle}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                        isValid ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500")}>
                        {isValid ? <Check className="w-4 h-4" /> : icon}
                    </div>
                    <h3 className={cn( "font-medium transition-colors", isValid && "text-green-600" )}>
                        {title}
                    </h3>
                </div>
                <ChevronDown className={cn( "w-4 h-4 transition-transform", open && "rotate-180", isDisabled && "opacity-50" )}/>
            </CardHeader>

            {open && !isDisabled && (
                <CardContent className="pt-0">{children}</CardContent>
            )}
        </Card>
    );
}
