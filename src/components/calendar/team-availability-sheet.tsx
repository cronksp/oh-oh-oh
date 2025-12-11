"use client";

import { Event } from "@/lib/db/schema";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { format, isSameDay, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    name: string;
}

interface TeamAvailabilitySheetProps {
    users: User[];
    events: (Event & { ownerName?: string | null })[];
    currentDate: Date;
}

export function TeamAvailabilitySheet({ users, events, currentDate }: TeamAvailabilitySheetProps) {
    const today = new Date(); // Or use currentDate if we want to show status for the viewed month? 
    // Usually "Status" implies "Right Now" or "Today". Let's stick to "Today" for "Status", 
    // but maybe list upcoming OOO? 
    // The request said "status of a certain person" / "who would be in/out on a particular day".
    // Let's show today's status by default, maybe allow picking a date?
    // For simplicity MVP, let's show status for the `currentDate` (which is likely start of month/week? No, currentDate passed from page is usually "now" or selected date).
    // Actually `currentDate` in page.tsx is the viewed date.

    // Let's show a list of users and their status for EACH day of the current week? Too complex.
    // Let's show status for TODAY.

    const targetDate = new Date();

    const getUserStatus = (userId: string) => {
        const userEvents = events.filter(e => e.userId === userId && e.isOutOfOffice);
        const activeEvent = userEvents.find(e =>
            isWithinInterval(targetDate, { start: e.startTime, end: e.endTime })
        );

        if (activeEvent) {
            return { status: "Out", detail: activeEvent.title, color: "text-red-600 bg-red-50 border-red-200" };
        }
        return { status: "In", detail: "Available", color: "text-green-600 bg-green-50 border-green-200" };
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Team Status
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Team Status</SheetTitle>
                    <SheetDescription>
                        Availability for {format(targetDate, "PPP")}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                    {users.map(user => {
                        const { status, detail, color } = getUserStatus(user.id);
                        return (
                            <div key={user.id} className="flex items-center justify-between p-2 rounded-lg border">
                                <div className="font-medium">{user.name}</div>
                                <div className={cn("px-2 py-1 rounded text-xs border font-medium", color)}>
                                    {status === "Out" ? detail : status}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </SheetContent>
        </Sheet>
    );
}
