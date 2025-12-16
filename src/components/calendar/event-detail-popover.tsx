"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Lock, Users } from "lucide-react";
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
    eventTypeName?: string | null;
}

export function EventDetailPopover({ event, children, onEdit, canEdit = false, canDelete = false, isOwner = false, ownerName, eventTypeName }: EventDetailPopoverProps) {
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

    // Use eventTypeName if available, otherwise fallback to formatted eventType key
    const displayType = eventTypeName || event.eventType.replace(/_/g, " ");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {/* 
                  Using a wrapper component to handle event propagation explicitly if needed, 
                  but strictly speaking, the Trigger should just work.
                  The issue with Permissions button is different. 
                */}
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold leading-none flex items-center gap-2">
                                {event.title}
                                {event.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </h4>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-xs text-muted-foreground capitalize">
                                    {displayType}
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
                        <div className="max-h-[200px] overflow-y-auto rounded-md bg-slate-50 dark:bg-slate-900/50 p-2 border">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                {event.description}
                            </p>
                        </div>
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
                            <div className="flex gap-2 items-center">
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
                                {isOwner && !event.isPrivate && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <EventPermissionsDialog
                                            event={event}
                                            trigger={
                                                <Button size="icon" variant="ghost" className="h-9 w-9">
                                                    <Users className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
