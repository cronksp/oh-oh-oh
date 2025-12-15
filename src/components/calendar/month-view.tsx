"use client";

import { useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Event, EventType } from "@/lib/db/schema";
import { EventDetailPopover } from "./event-detail-popover";
import { EditEventDialog } from "./edit-event-dialog";
import { CreateEventDialog } from "./create-event-dialog";
import { WhosOutSummary } from "./whos-out-summary";

type EventWithPermissions = Event & {
    ownerName?: string | null;
    permissions?: {
        canEdit: boolean;
        canDelete: boolean;
        isOwner: boolean;
    };
    groupingIds?: string[];
};

interface MonthViewProps {
    currentDate: Date;
    events: EventWithPermissions[];
    userId: string;
    groupings: { id: string; name: string; color: string | null }[];
    eventTypes: EventType[];
}

export function MonthView({ currentDate, events, userId, groupings, eventTypes }: MonthViewProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [creatingEventForDate, setCreatingEventForDate] = useState<Date | null>(null);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function getEventsForDay(day: Date) {
        return events.filter((event) =>
            isSameDay(new Date(event.startTime), day)
        );
    }

    return (
        <>
            <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                {/* Header */}
                <div className="grid grid-cols-7 border-b bg-slate-50 dark:bg-slate-900">
                    {weekDays.map((day) => (
                        <div key={day} className="py-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 grid-rows-6 flex-1">
                    {days.map((day) => {
                        const dayEvents = getEventsForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "border-r border-b p-2 min-h-0 overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900",
                                    !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/50",
                                    isToday && "bg-blue-50 dark:bg-blue-950/20"
                                )}
                                onClick={() => setCreatingEventForDate(day)}
                            >
                                <div className={cn(
                                    "text-sm font-medium mb-1",
                                    !isCurrentMonth && "text-slate-400",
                                    isToday && "text-blue-600 dark:text-blue-400"
                                )}>
                                    {format(day, "d")}
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map((event) => {
                                        const { canEdit, canDelete, isOwner } = event.permissions || {};
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
                                                    className="text-xs px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        if (canEdit) setEditingEvent(event);
                                                    }}
                                                >
                                                    {event.title}
                                                </div>
                                            </EventDetailPopover>
                                        );
                                    })}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            +{dayEvents.length - 3} more
                                        </div>
                                    )}
                                    <WhosOutSummary events={dayEvents} date={day} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {editingEvent && (
                <EditEventDialog
                    event={editingEvent}
                    open={!!editingEvent}
                    onOpenChange={(open) => !open && setEditingEvent(null)}
                    groupings={groupings}
                    eventTypes={eventTypes}
                />
            )}

            {creatingEventForDate && (
                <CreateEventDialog
                    initialDate={creatingEventForDate}
                    open={!!creatingEventForDate}
                    onOpenChange={(open) => !open && setCreatingEventForDate(null)}
                    groupings={groupings}
                    eventTypes={eventTypes}
                />
            )}
        </>
    );
}
