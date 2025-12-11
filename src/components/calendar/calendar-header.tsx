"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfToday, format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CalendarHeaderProps {
    currentDate: Date;
    view: "month" | "week" | "day";
}

export function CalendarHeader({ currentDate, view }: CalendarHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    const navigate = (direction: "prev" | "next" | "today") => {
        let newDate = new Date(currentDate);

        if (direction === "today") {
            newDate = startOfToday();
        } else {
            switch (view) {
                case "month":
                    newDate = direction === "next" ? addMonths(newDate, 1) : subMonths(newDate, 1);
                    break;
                case "week":
                    newDate = direction === "next" ? addWeeks(newDate, 1) : subWeeks(newDate, 1);
                    break;
                case "day":
                    newDate = direction === "next" ? addDays(newDate, 1) : subDays(newDate, 1);
                    break;
            }
        }

        router.push(`?${createQueryString("date", newDate.toISOString())}`);
    };

    const handleViewChange = (newView: string) => {
        router.push(`?${createQueryString("view", newView)}`);
    };

    const getTitle = () => {
        switch (view) {
            case "month":
                return format(currentDate, "MMMM yyyy");
            case "week":
                return `Week of ${format(currentDate, "MMM d, yyyy")}`;
            case "day":
                return format(currentDate, "MMMM d, yyyy");
        }
    };

    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent min-w-[250px]">
                    {getTitle()}
                </h1>
                <div className="flex items-center rounded-md border bg-background shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("today")} className="px-3">
                        Today
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Select value={view} onValueChange={handleViewChange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
