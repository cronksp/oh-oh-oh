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
import { Event, EventType } from "@/lib/db/schema";
import { EventForm, EventFormValues } from "./event-form";

// Extend Event type to include groupingIds which are attached at runtime
interface ExtendedEvent extends Event {
    groupingIds?: string[];
    teamIds?: string[];
    attendees?: { userId: string, invitedViaTeamId: string | null }[];
}

interface EditEventDialogProps {
    event: ExtendedEvent;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupings?: { id: string; name: string; color: string | null }[];
    eventTypes?: EventType[];
}

import { getUsers } from "@/features/users/actions";
import { getTeams } from "@/features/teams/actions";
import { useState, useEffect } from "react";

export function EditEventDialog({ event, open, onOpenChange, groupings = [], eventTypes = [] }: EditEventDialogProps) {
    const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        let mounted = true;
        Promise.all([
            getUsers(),
            getTeams()
        ]).then(([usersData, teamsData]) => {
            if (mounted) {
                setUsers(usersData);
                setTeams([...teamsData.publicTeams, ...teamsData.myPrivateTeams]);
            }
        });
        return () => { mounted = false; };
    }, []);
    const defaultValues: EventFormValues = {
        title: event.title,
        description: event.description || "",
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        eventTypeId: event.eventTypeId || eventTypes.find(et => et.key === event.eventType)?.id || "",
        isOutOfOffice: event.isOutOfOffice,
        isPrivate: event.isPrivate,
        groupingIds: event.groupingIds || [],
        teamIds: event.teamIds || [],
        // Filter out attendees that were invited via a team (they shouldn't be manually removable as individuals, strictly speaking, 
        // but for MVP let's just show explicit direct invites in the attendees box).
        attendeeIds: event.attendees
            ? event.attendees.filter(a => !a.invitedViaTeamId).map(a => a.userId)
            : [],
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
                    eventTypes={eventTypes}
                    submitLabel="Edit Event"
                    users={users}
                    teams={teams}
                />
            </DialogContent>
        </Dialog>
    );
}
