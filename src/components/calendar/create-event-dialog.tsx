"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createEvent } from "@/features/calendar/actions";

import { MultiSelect } from "@/components/ui/multi-select";

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startTime: z.date(),
    endTime: z.date(),
    isPrivate: z.boolean().default(false),
    isOutOfOffice: z.boolean().default(false),
    eventType: z.enum(["vacation", "sick_leave", "project_travel", "personal_travel", "personal_appointment", "work_meeting", "work_gathering"]),
    groupingIds: z.array(z.string()).default([]),
}).refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
});

type FormValues = z.infer<typeof formSchema>;

interface CreateEventDialogProps {
    initialDate?: Date;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    groupings?: { id: string; name: string; color: string | null }[];
}

export function CreateEventDialog({ initialDate, open: controlledOpen, onOpenChange, groupings = [] }: CreateEventDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    // Use controlled open state if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    const defaultStart = initialDate || new Date();
    const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); // 1 hour later

    const form = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            startTime: defaultStart,
            endTime: defaultEnd,
            isPrivate: false,
            isOutOfOffice: false,
            eventType: "work_meeting",
            groupingIds: [],
        },
    });

    // Update form when initialDate changes or dialog opens
    useState(() => {
        if (open && initialDate) {
            const newStart = initialDate;
            const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
            form.reset({
                title: "",
                description: "",
                startTime: newStart,
                endTime: newEnd,
                isPrivate: false,
                isOutOfOffice: false,
                eventType: "work_meeting",
                groupingIds: [],
            });
        }
    });

    async function onSubmit(values: FormValues) {
        try {
            await createEvent(values);
            toast.success("Event created");
            setOpen(false);
            form.reset();
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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Meeting with team" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="groupingIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Groupings</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={groupings.map(g => ({ label: g.name, value: g.id, color: g.color }))}
                                            selected={field.value || []}
                                            onChange={field.onChange}
                                            placeholder="Select groupings..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isOutOfOffice"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors" onClick={() => field.onChange(!field.value)}>
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base cursor-pointer">Out of Office</FormLabel>
                                        <DialogDescription>
                                            Show as "Out" in team availability.
                                        </DialogDescription>
                                    </div>
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500 pointer-events-none"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isPrivate"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors" onClick={() => field.onChange(!field.value)}>
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base cursor-pointer">Private Event</FormLabel>
                                        <DialogDescription>
                                            Only you can see the details of this event.
                                        </DialogDescription>
                                    </div>
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500 pointer-events-none"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="pt-4">
                            <Button type="submit" size="lg" className="w-full text-md font-semibold">
                                Add Event
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
