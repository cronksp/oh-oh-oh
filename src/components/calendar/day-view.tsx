"use client";

import { useState, useEffect } from "react";
import { format, isSameDay, differenceInMinutes } from "date-fns";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Event, EventType } from "@/lib/db/schema";
import { EventDetailPopover } from "./event-detail-popover";
import { EditEventDialog } from "./edit-event-dialog";

type EventWithPermissions = Event & {
    ownerName?: string | null;
    permissions?: {
        canEdit: boolean;
        canDelete: boolean;
        isOwner: boolean;
    };
};

interface DayViewProps {
    currentDate: Date;
    events: EventWithPermissions[];
    userId: string;
    eventTypes: EventType[];
}

export function DayView({ currentDate, events, userId, eventTypes }: DayViewProps) {
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = events.filter((event) => isSameDay(new Date(event.startTime), currentDate));

    return (
        <>
            <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                {/* Header */}
                <div className="border-b bg-slate-50 dark:bg-slate-900 p-4 text-center">
                    <div className="text-lg font-medium text-slate-500 dark:text-slate-400">
                        {format(currentDate, "EEEE")}
                    </div>
                    <div className={cn(
                        "text-2xl font-bold h-10 w-10 flex items-center justify-center rounded-full mx-auto mt-1",
                        isSameDay(currentDate, new Date()) && "bg-blue-600 text-white"
                    )}>
                        {format(currentDate, "d")}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-[60px_1fr] divide-x dark:divide-slate-800 relative">
                        {/* Time Column */}
                        <div className="bg-slate-50 dark:bg-slate-900/50">
                            {hours.map((hour) => (
                                <div key={hour} className="h-20 border-b dark:border-slate-800 text-xs text-slate-400 text-right pr-2 pt-1 relative">
                                    <span className="-top-2.5 relative">{format(new Date().setHours(hour, 0, 0, 0), "h a")}</span>
                                </div>
                            ))}
                        </div>

                        {/* Events Column */}
                        <div className="relative">
                            {hours.map((hour) => (
                                <div key={hour} className="h-20 border-b dark:border-slate-800" />
                            ))}

                            {/* Events Overlay */}
                            {dayEvents.map((event) => {
                                const start = new Date(event.startTime);
                                const end = new Date(event.endTime);
                                const startMinutes = start.getHours() * 60 + start.getMinutes();
                                const durationMinutes = differenceInMinutes(end, start);
                                const { canEdit, canDelete, isOwner } = event.permissions || {};

                                const top = (startMinutes / 60) * 80; // h-20 is 80px
                                const height = (durationMinutes / 60) * 80; // h-20 is 80px

                                return (
                                    <EventDetailPopover
                                        key={event.id}
                                        event={event}
                                        canEdit={canEdit}
                                        canDelete={canDelete}
                                        isOwner={isOwner}
                                        ownerName={event.ownerName}
                                        onEdit={() => setEditingEvent(event)}
                                    >
                                        <button
                                            className={cn(
                                                "absolute text-left left-2 right-2 rounded p-2 text-sm overflow-hidden border shadow-sm",
                                                event.isPrivate
                                                    ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                            )}
                                            style={{
                                                top: `${top}px`,
                                                height: `${Math.max(height, 40)}px`, // Minimum height
                                            }}
                                            title={`${event.title} (${format(start, "h:mm a")} - ${format(end, "h:mm a")})`}
                                            onClick={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                if (canEdit) setEditingEvent(event);
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold truncate flex items-center">
                                                    {event.isPrivate && <Lock className="h-3 w-3 mr-1 flex-shrink-0" />}
                                                    <span className="truncate">{event.title}</span>
                                                </div>
                                                <div className="text-xs opacity-80 whitespace-nowrap">
                                                    {format(start, "h:mm a")} - {format(end, "h:mm a")}
                                                </div>
                                            </div>
                                            {event.description && !event.isPrivate && (
                                                <div className="mt-1 text-xs opacity-80 line-clamp-2">
                                                    {event.description}
                                                </div>
                                            )}
                                        </button>
                                    </EventDetailPopover>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {editingEvent && (
                <EditEventDialog
                    event={editingEvent}
                    open={!!editingEvent}
                    onOpenChange={(open) => !open && setEditingEvent(null)}
                    eventTypes={eventTypes}
                />
            )}
        </>
    );
}
