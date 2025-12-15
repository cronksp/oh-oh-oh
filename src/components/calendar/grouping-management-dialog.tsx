"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createGrouping, deleteGrouping, createEventType } from "@/features/calendar/actions";
import { Trash2, Settings, Lock } from "lucide-react";
import { EventType } from "@/lib/db/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// --- Schemas ---

const groupingSchema = z.object({
    name: z.string().min(1, "Name is required"),
    color: z.string().min(1, "Color is required"),
    isPrivate: z.boolean().default(false),
});

const eventTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    color: z.string().min(1, "Color is required"),
    isPrivate: z.boolean().default(true), // Default to private for users
});

type GroupingFormValues = z.infer<typeof groupingSchema>;
type EventTypeFormValues = z.infer<typeof eventTypeSchema>;

interface Grouping {
    id: string;
    name: string;
    color: string | null;
    userId?: string | null;
}

interface GroupingManagementDialogProps {
    groupings: Grouping[];
    eventTypes?: EventType[];
}

export function GroupingManagementDialog({ groupings, eventTypes = [] }: GroupingManagementDialogProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"groupings" | "eventTypes">("groupings");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Calendar Settings">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Calendar Settings</DialogTitle>
                    <DialogDescription>
                        Manage your calendar groupings and custom event types.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 border-b mb-4">
                    <Button
                        variant={activeTab === "groupings" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("groupings")}
                        className="rounded-b-none"
                    >
                        Groupings
                    </Button>
                    <Button
                        variant={activeTab === "eventTypes" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("eventTypes")}
                        className="rounded-b-none"
                    >
                        Event Types
                    </Button>
                </div>

                <div className="min-h-[300px]">
                    {activeTab === "groupings" ? (
                        <GroupingsTab groupings={groupings} />
                    ) : (
                        <EventTypesTab eventTypes={eventTypes} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function GroupingsTab({ groupings }: { groupings: Grouping[] }) {
    const form = useForm<GroupingFormValues>({
        resolver: zodResolver(groupingSchema),
        defaultValues: {
            name: "",
            color: "#3b82f6",
            isPrivate: false,
        },
    });

    async function onSubmit(values: GroupingFormValues) {
        try {
            await createGrouping(values);
            toast.success("Grouping created");
            form.reset();
        } catch {
            toast.error("Failed to create grouping");
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteGrouping(id);
            toast.success("Grouping deleted");
        } catch {
            toast.error("Failed to delete grouping");
        }
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-b pb-4">
                    <div className="grid grid-cols-[1fr_auto] gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Project A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <FormControl>
                                        <Input type="color" className="w-12 p-1 h-9" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="isPrivate"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Private Grouping</FormLabel>
                                    <FormDescription>
                                        Only visible to you
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" size="sm" className="w-full">Create Grouping</Button>
                </form>
            </Form>

            <div className="space-y-2">
                <h4 className="text-sm font-medium">Existing Groupings</h4>
                {groupings.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No groupings yet.</p>
                )}
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                    {groupings.map((grouping) => (
                        <div key={grouping.id} className="flex items-center justify-between p-2 rounded-md border bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: grouping.color || "#3b82f6" }}
                                />
                                <span className="text-sm font-medium">{grouping.name}</span>
                                {grouping.userId && <Lock className="w-3 h-3 text-muted-foreground ml-1" />}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(grouping.id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function EventTypesTab({ eventTypes }: { eventTypes: EventType[] }) {
    const form = useForm<EventTypeFormValues>({
        resolver: zodResolver(eventTypeSchema),
        defaultValues: {
            name: "",
            color: "#eab308",
            isPrivate: true,
        },
    });

    async function onSubmit(values: EventTypeFormValues) {
        try {
            await createEventType(values);
            toast.success("Event Type created");
            form.reset();
        } catch (e) {
            toast.error("Failed to create event type. Note: Only Admins can create System (Public) types.");
        }
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-b pb-4">
                    <div className="grid grid-cols-[1fr_auto] gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Yoga" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <FormControl>
                                        <Input type="color" className="w-12 p-1 h-9" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="isPrivate"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Private Type</FormLabel>
                                    <FormDescription>
                                        Only visible to you. Uncheck for System Type (Admin only).
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" size="sm" className="w-full">Create Event Type</Button>
                </form>
            </Form>

            <div className="space-y-2">
                <h4 className="text-sm font-medium">Existing Types</h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                    {eventTypes.map((type) => (
                        <div key={type.id} className="flex items-center justify-between p-2 rounded-md border bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: type.color || "#ccc" }}
                                />
                                <span className="text-sm font-medium">{type.name}</span>
                                {type.userId && <Lock className="w-3 h-3 text-muted-foreground ml-1" />}
                            </div>
                            {/* Deletion not implemented yet for types, can add later if requested */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
