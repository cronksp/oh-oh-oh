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

interface CreateEventDialogProps {
    initialDate?: Date;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    groupings?: { id: string; name: string; color: string | null }[];
}

export function CreateEventDialog({ initialDate, open: controlledOpen, onOpenChange, groupings = [] }: CreateEventDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Use controlled open state if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    const defaultStart = initialDate || new Date();
    // Default to next hour if no initial date provided (start of next hour), otherwise current time + 1 hour? 
    // Wait, if I click "Create Event" it usually defaults to now.
    // If I click a day, it defaults to that day.

    // To match behaviors:
    // If initialDate is provided, it's usually 00:00 of that day (because of MonthView click).
    // Let's set default start time to 9am if it's 00:00? Or just leave it. 
    // The original code did:
    // const defaultStart = initialDate || new Date();
    // const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

    // However, if initialDate is coming from "click on day", it might be 00:00.
    // Let's stick to original logic.

    const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); // 1 hour later

    const defaultValues: EventFormValues = {
        title: "",
        description: "",
        startTime: defaultStart,
        endTime: defaultEnd,
        isPrivate: false,
        isOutOfOffice: false,
        eventType: "work_meeting",
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
                    submitLabel="Add Event"
                />
            </DialogContent>
        </Dialog>
    );
}
