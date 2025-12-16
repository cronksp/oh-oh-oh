import { Suspense } from "react";
import { ActivityList } from "@/components/activity/activity-list";
import { getActivityLog } from "@/features/calendar/actions";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ActivityLogPage() {
    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Activity Log</h2>
                    <p className="text-muted-foreground">
                        Recent activity across the organization.
                    </p>
                </div>
            </div>

            <Suspense fallback={<ActivityLogSkeleton />}>
                <ActivityDisplay />
            </Suspense>
        </div>
    );
}

async function ActivityDisplay() {
    // Initial fetch of 'all' (client component will handle filtering switching? 
    // Or we make the page accept searchParams?)
    // Making it client-side filterable for simple MVP is easier if data volume is low.
    // server action fetches 50 recent.
    // Let's implement filtering in the client component by calling server action on change.

    // Actually, let's just pass the initial data to the client component.
    const initialLogs = await getActivityLog("all");

    return <ActivityList initialLogs={initialLogs} />;
}

function ActivityLogSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-[200px]" />
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
