"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { rsvpEvent } from "@/features/calendar/actions";
import { Check, X, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/auth/session"; // Wait, can't import server util in client.
// We need to pass currentUserId or fetch it.
// Let's create a server action to get current user ID for client usage?
// Or better: use useSession from next-auth if available? No, we use custom JOSE auth.
// We can just try to RSVP. If it fails (not authenticated or not invited), correct.
// But we want to hide buttons if not invited.
// The list of attendees is public (to the popover). We just need to know "who am I".
// Let's create `useCurrentUser` hook or similar? 
// For now, I'll allow the buttons and check server side.
// Visual feedback: Highlight my status.
// Actually, `getEvents` could return `myStatus` or `isAttendee`.

// Let's make this component fetch "me" or similar.
// Or just passing `currentUserId` from the parent. 
// But `EventDetailPopover` doesn't have it.
// `getEvents` does filter events.
// Let's just create a small server action `getMe` for this component.

import { getMe } from "@/features/users/actions";

export function RsvpActions({ eventId, attendees }: { eventId: string, attendees?: any[] }) {
    const [myId, setMyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getMe().then((user: { id: string } | null) => {
            if (user) setMyId(user.id);
        });
    }, []);

    if (!myId || !attendees) return null;

    const myAttendeeRecord = attendees.find((a: any) => a.userId === myId);
    if (!myAttendeeRecord) return null; // Not invited

    const handleRsvp = async (status: "accepted" | "declined" | "tentative") => {
        setLoading(true);
        try {
            await rsvpEvent(eventId, status);
            toast.success("RSVP updated");
            // Optimistic update? We assume parent revalidates or we refresh.
            // But we don't have direct access to refresh parent list without router refresh.
            // location.reload() is too heavy.
        } catch (error) {
            toast.error("Failed to RSVP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Your RSVP:</span>
            <div className="flex gap-1">
                <Button
                    size="sm"
                    variant={myAttendeeRecord.status === "accepted" ? "default" : "outline"}
                    className="h-7 w-7 p-0 rounded-full"
                    onClick={() => handleRsvp("accepted")}
                    disabled={loading}
                    title="Accept"
                >
                    <Check className="h-3 w-3" />
                </Button>
                <Button
                    size="sm"
                    variant={myAttendeeRecord.status === "tentative" ? "secondary" : "outline"}
                    className="h-7 w-7 p-0 rounded-full"
                    onClick={() => handleRsvp("tentative")}
                    disabled={loading}
                    title="Maybe"
                >
                    <HelpCircle className="h-3 w-3" />
                </Button>
                <Button
                    size="sm"
                    variant={myAttendeeRecord.status === "declined" ? "destructive" : "outline"}
                    className="h-7 w-7 p-0 rounded-full"
                    onClick={() => handleRsvp("declined")}
                    disabled={loading}
                    title="Decline"
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
