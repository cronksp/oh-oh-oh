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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createGrouping, deleteGrouping } from "@/features/calendar/actions";
import { Trash2, Users } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    color: z.string().min(1, "Color is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface Grouping {
    id: string;
    name: string;
    color: string | null;
}

interface GroupingManagementDialogProps {
    groupings: Grouping[];
}

export function GroupingManagementDialog({ groupings }: GroupingManagementDialogProps) {
    const [open, setOpen] = useState(false);
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            color: "#3b82f6", // Default blue
        },
    });

    async function onSubmit(values: FormValues) {
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Manage Groupings">
                    <Users className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Groupings</DialogTitle>
                    <DialogDescription>
                        Create and manage event groupings (tags).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Create Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-b pb-4">
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
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input type="color" className="w-12 p-1 h-9" {...field} />
                                            </FormControl>
                                            <div className="text-xs text-muted-foreground self-center">
                                                Pick a color for this grouping
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" size="sm" className="w-full">Create Grouping</Button>
                        </form>
                    </Form>

                    {/* List */}
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
            </DialogContent>
        </Dialog>
    );
}
