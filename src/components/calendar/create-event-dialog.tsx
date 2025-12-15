"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createEvent } from "@/features/calendar/actions";
import { EventForm, EventFormValues } from "./event-form";
import { EventType } from "@/lib/db/schema";

interface CreateEventDialogProps {
    initialDate?: Date;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    groupings?: { id: string; name: string; color: string | null }[];
    eventTypes?: EventType[];
}

export function CreateEventDialog({ initialDate, open: controlledOpen, onOpenChange, groupings = [], eventTypes = [] }: CreateEventDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Use controlled open state if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    const now = new Date();
    const nextHourStart = new Date(now);
    nextHourStart.setHours(nextHourStart.getHours() + 1, 0, 0, 0);

    const defaultStart = initialDate ? new Date(initialDate) : nextHourStart;

    // Apply the time from the next closest hour to the selected date
    // This ensures that even if a date is selected, the time defaults to the next hour relative to the user
    if (initialDate) {
        defaultStart.setHours(nextHourStart.getHours(), 0, 0, 0);
    }

    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultStart.getHours() + 1);

    const defaultValues: EventFormValues = {
        title: "",
        description: "",
        startTime: defaultStart,
        endTime: defaultEnd,
        isPrivate: false,
        isOutOfOffice: false,
        eventTypeId: eventTypes?.find(et => et.key === "work_meeting")?.id || eventTypes?.[0]?.id || "",
        groupingIds: [],
    };

    async function onSubmit(values: EventFormValues) {
        try {
            await createEvent(values);
            toast.success("Event created");
            setOpen(false);
        } catch {
            toast.error("Failed to create event");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Event</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Event</DialogTitle>
                    <DialogDescription>
                        Add a new event to your calendar.
                    </DialogDescription>
                </DialogHeader>
                <EventForm
                    defaultValues={defaultValues}
                    onSubmit={onSubmit}
                    groupings={groupings}
                    eventTypes={eventTypes}
                    submitLabel="Add Event"
                />
            </DialogContent>
        </Dialog>
    );
}
