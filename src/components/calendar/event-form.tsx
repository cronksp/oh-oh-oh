"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, isValid } from "date-fns";

import { Button } from "@/components/ui/button";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from "react";

export const eventFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startTime: z.date(),
    endTime: z.date(),
    eventType: z.enum(["vacation", "sick_leave", "project_travel", "personal_travel", "personal_appointment", "work_meeting", "work_gathering"]),
    isOutOfOffice: z.boolean().default(false),
    isPrivate: z.boolean().default(false),
    groupingIds: z.array(z.string()).default([]),
}).refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
    defaultValues: EventFormValues;
    onSubmit: (values: EventFormValues) => Promise<void>;
    groupings: { id: string; name: string; color: string | null }[];
    submitLabel: string;
}

export function EventForm({ defaultValues, onSubmit, groupings, submitLabel }: EventFormProps) {
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    const form = useForm<EventFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(eventFormSchema) as any,
        defaultValues,
    });

    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);

    return (
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
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Optional description" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Start</FormLabel>
                            <div className="flex gap-2">
                                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "flex-1 pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value && isValid(field.value) ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date) {
                                                    const newDate = new Date(date);
                                                    if (field.value) {
                                                        newDate.setHours(field.value.getHours());
                                                        newDate.setMinutes(field.value.getMinutes());
                                                    }
                                                    field.onChange(newDate);
                                                }
                                                setStartDateOpen(false);
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Select
                                    value={field.value && isValid(field.value) ? format(field.value, "HH:mm") : undefined}
                                    onValueChange={(value) => {
                                        if (!field.value) return;
                                        const [hours, minutes] = value.split(":").map(Number);
                                        const newDate = new Date(field.value);
                                        newDate.setHours(hours);
                                        newDate.setMinutes(minutes);
                                        field.onChange(newDate);
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] shrink-0">
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {Array.from({ length: 96 }).map((_, i) => {
                                            const hour = Math.floor(i / 4);
                                            const minute = (i % 4) * 15;
                                            const date = new Date();
                                            date.setHours(hour);
                                            date.setMinutes(minute);

                                            const timeString24 = format(date, "HH:mm");
                                            const timeStringAMPM = format(date, "hh:mm a");

                                            return (
                                                <SelectItem key={timeString24} value={timeString24}>
                                                    {timeStringAMPM}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>End</FormLabel>
                            <div className="flex gap-2">
                                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "flex-1 pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value && isValid(field.value) ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date && field.value) {
                                                    const newDate = new Date(date);
                                                    newDate.setHours(field.value.getHours());
                                                    newDate.setMinutes(field.value.getMinutes());
                                                    field.onChange(newDate);
                                                } else if (date) {
                                                    field.onChange(date);
                                                }
                                                setEndDateOpen(false);
                                            }}
                                            disabled={(date) => {
                                                const startDate = form.watch("startTime");
                                                return startDate ? date < new Date(startDate.setHours(0, 0, 0, 0)) : false;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Select
                                    value={field.value && isValid(field.value) ? format(field.value, "HH:mm") : undefined}
                                    onValueChange={(value) => {
                                        if (!field.value) return;
                                        const [hours, minutes] = value.split(":").map(Number);
                                        const newDate = new Date(field.value);
                                        newDate.setHours(hours);
                                        newDate.setMinutes(minutes);
                                        field.onChange(newDate);
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] shrink-0">
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {Array.from({ length: 96 }).map((_, i) => {
                                            const hour = Math.floor(i / 4);
                                            const minute = (i % 4) * 15;
                                            const date = new Date();
                                            date.setHours(hour);
                                            date.setMinutes(minute);

                                            const timeString24 = format(date, "HH:mm");
                                            const timeStringAMPM = format(date, "hh:mm a");

                                            return (
                                                <SelectItem key={timeString24} value={timeString24}>
                                                    {timeStringAMPM}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="work_meeting">Work Meeting</SelectItem>
                                    <SelectItem value="vacation">Vacation</SelectItem>
                                    <SelectItem value="sick_leave">Sick Leave</SelectItem>
                                    <SelectItem value="personal_appointment">Personal Appointment</SelectItem>
                                    <SelectItem value="project_travel">Project Travel</SelectItem>
                                    <SelectItem value="personal_travel">Personal Travel</SelectItem>
                                    <SelectItem value="work_gathering">Work Gathering</SelectItem>
                                </SelectContent>
                            </Select>
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
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
