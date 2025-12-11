"use client";

import { useState } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Event } from "@/lib/db/schema";
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

interface WeekViewProps {
    currentDate: Date;
    events: EventWithPermissions[];
    userId: string;
}

export function WeekView({ currentDate, events, userId }: WeekViewProps) {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <>
            <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                {/* Header */}
                <div className="grid grid-cols-8 border-b bg-slate-50 dark:bg-slate-900 divide-x dark:divide-slate-800">
                    <div className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 border-r dark:border-slate-800">
                        Time
                    </div>
                    {days.map((day) => (
                        <div key={day.toString()} className="py-2 text-center">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {format(day, "EEE")}
                            </div>
                            <div className={cn(
                                "text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full mx-auto mt-1",
                                isSameDay(day, new Date()) && "bg-blue-600 text-white"
                            )}>
                                {format(day, "d")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-8 divide-x dark:divide-slate-800 relative">
                        {/* Time Column */}
                        <div className="bg-slate-50 dark:bg-slate-900/50">
                            {hours.map((hour) => (
                                <div key={hour} className="h-14 border-b dark:border-slate-800 text-xs text-slate-400 text-right pr-2 pt-1 relative">
                                    <span className="-top-2.5 relative">{format(new Date().setHours(hour, 0, 0, 0), "h a")}</span>
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        {days.map((day) => {
                            const dayEvents = events.filter((event) => isSameDay(new Date(event.startTime), day));

                            return (
                                <div key={day.toString()} className="relative">
                                    {hours.map((hour) => (
                                        <div key={hour} className="h-14 border-b dark:border-slate-800" />
                                    ))}

                                    {/* Events Overlay */}
                                    {dayEvents.map((event) => {
                                        const start = new Date(event.startTime);
                                        const end = new Date(event.endTime);
                                        const startMinutes = start.getHours() * 60 + start.getMinutes();
                                        const durationMinutes = differenceInMinutes(end, start);
                                        const { canEdit, canDelete, isOwner } = event.permissions || {};

                                        // Calculate position and height (14px per 15 mins approx, 56px per hour)
                                        // h-14 is 3.5rem = 56px. So 56px / 60min = 0.933px per minute.
                                        const top = (startMinutes / 60) * 56; // 3.5rem = 56px
                                        const height = (durationMinutes / 60) * 56;

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
                                                <div
                                                    className={cn(
                                                        "absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs overflow-hidden cursor-pointer border",
                                                        event.isPrivate
                                                            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                                    )}
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${Math.max(height, 20)}px`, // Minimum height for visibility
                                                    }}
                                                    title={`${event.title} (${format(start, "h:mm a")} - ${format(end, "h:mm a")})`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        if (canEdit) setEditingEvent(event);
                                                    }}
                                                >
                                                    <div className="font-semibold truncate">
                                                        {event.isPrivate && <span className="mr-1">🔒</span>}
                                                        {event.title}
                                                    </div>
                                                    <div className="truncate opacity-80">
                                                        {format(start, "h:mm a")} - {format(end, "h:mm a")}
                                                    </div>
                                                </div>
                                            </EventDetailPopover>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {editingEvent && (
                <EditEventDialog
                    event={editingEvent}
                    open={!!editingEvent}
                    onOpenChange={(open) => !open && setEditingEvent(null)}
                />
            )}
        </>
    );
}
