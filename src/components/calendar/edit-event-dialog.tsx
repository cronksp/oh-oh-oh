"use client";

import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { updateEvent } from "@/features/calendar/actions";
import { Event } from "@/lib/db/schema";
import { EventForm, EventFormValues } from "./event-form";

// Extend Event type to include groupingIds which are attached at runtime
interface ExtendedEvent extends Event {
    groupingIds?: string[];
}

interface EditEventDialogProps {
    event: ExtendedEvent;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupings?: { id: string; name: string; color: string | null }[];
}

export function EditEventDialog({ event, open, onOpenChange, groupings = [] }: EditEventDialogProps) {
    const defaultValues: EventFormValues = {
        title: event.title,
        description: event.description || "",
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        eventType: event.eventType,
        isOutOfOffice: event.isOutOfOffice,
        isPrivate: event.isPrivate,
        groupingIds: event.groupingIds || [],
    };

    async function onSubmit(values: EventFormValues) {
        try {
            await updateEvent(event.id, values);
            toast.success("Event updated");
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update event");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                    <DialogDescription>
                        Update event details
                    </DialogDescription>
                </DialogHeader>
                <EventForm
                    defaultValues={defaultValues}
                    onSubmit={onSubmit}
                    groupings={groupings}
                    submitLabel="Edit Event"
                />
            </DialogContent>
        </Dialog>
    );
}
