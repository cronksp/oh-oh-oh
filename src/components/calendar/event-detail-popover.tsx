"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Lock } from "lucide-react";
import { Event } from "@/lib/db/schema";
import { deleteEvent } from "@/features/calendar/actions";
import { toast } from "sonner";

import { EventPermissionsDialog } from "./event-permissions-dialog";

interface EventDetailPopoverProps {
    event: Event;
    children: React.ReactNode;
    onEdit?: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
    isOwner?: boolean;
    ownerName?: string | null;
}

export function EventDetailPopover({ event, children, onEdit, canEdit = false, canDelete = false, isOwner = false, ownerName }: EventDetailPopoverProps) {
    const [open, setOpen] = useState(false);

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this event?")) return;

        try {
            await deleteEvent(event.id);
            toast.success("Event deleted");
            setOpen(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete event");
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold leading-none flex items-center gap-2">
                                {event.title}
                                {event.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </h4>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-xs text-muted-foreground capitalize">
                                    {event.eventType.replace(/_/g, " ")}
                                </p>
                                {ownerName && (
                                    <p className="text-xs text-muted-foreground">
                                        by {ownerName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {event.description && (
                        <p className="text-sm text-muted-foreground">
                            {event.description}
                        </p>
                    )}

                    <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Start:</span>
                            <span>{format(new Date(event.startTime), "PPP p")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">End:</span>
                            <span>{format(new Date(event.endTime), "PPP p")}</span>
                        </div>
                    </div>

                    {(canEdit || canDelete) && (
                        <div className="flex flex-col gap-2 pt-2 border-t">
                            <div className="flex gap-2">
                                {canEdit && onEdit && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpen(false);
                                            onEdit();
                                        }}
                                    >
                                        <Edit2 className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete();
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                            {isOwner && !event.isPrivate && (
                                <EventPermissionsDialog event={event} />
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
