"use client";

import { Event } from "@/lib/db/schema";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhosOutSummaryProps {
    events: (Event & { ownerName?: string | null })[];
    date: Date;
}

export function WhosOutSummary({ events }: WhosOutSummaryProps) {
    // Filter for OOO events
    const outEvents = events.filter(e => e.isOutOfOffice);

    if (outEvents.length === 0) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "mt-1 px-1 py-0.5 rounded text-[10px] font-medium cursor-pointer w-fit",
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800",
                        "hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {outEvents.length} Out
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-3" align="start">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm border-b pb-1">Who's Out</h4>
                    <div className="space-y-1">
                        {outEvents.map((event) => (
                            <div key={event.id} className="text-sm flex flex-col">
                                <span className="font-medium">{event.ownerName || "Unknown"}</span>
                                <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    {event.isPrivate && <Lock className="h-3 w-3 flex-shrink-0" />}
                                    {event.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
