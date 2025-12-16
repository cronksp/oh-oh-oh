import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { getEventsWithPermissions, getGroupings, getEventTypes } from "@/features/calendar/actions";
import { getUsers } from "@/features/users/actions";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import { CreateEventDialog } from "@/components/calendar/create-event-dialog";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { GroupingManagementDialog } from "@/components/calendar/grouping-management-dialog";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import { TeamAvailabilitySheet } from "@/components/calendar/team-availability-sheet";

interface CalendarPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
    const session = await getSession();
    if (!session?.user) redirect("/login");

    const params = await searchParams;
    const dateParam = typeof params.date === "string" ? params.date : undefined;
    const viewParam = typeof params.view === "string" ? params.view : "month";
    const myStuffOnly = params.myStuffOnly === "true";
    const groupingIdsParam = typeof params.groupings === "string" ? params.groupings : undefined;
    const groupingIds = groupingIdsParam?.split(",").filter(Boolean);

    const currentDate = dateParam ? new Date(dateParam) : new Date();
    const view = (["month", "week", "day"].includes(viewParam) ? viewParam : "month") as "month" | "week" | "day";

    let start: Date;
    let end: Date;

    switch (view) {
        case "month":
            start = startOfWeek(startOfMonth(currentDate));
            end = endOfWeek(endOfMonth(currentDate));
            break;
        case "week":
            start = startOfWeek(currentDate);
            end = endOfWeek(currentDate);
            break;
        case "day":
            start = startOfDay(currentDate);
            end = endOfDay(currentDate);
            break;
    }

    const filterUserId = typeof params.filterUserId === "string" ? params.filterUserId : undefined;

    const [events, groupings, users, eventTypes] = await Promise.all([
        getEventsWithPermissions(start, end, { myStuffOnly, groupingIds, filterUserId }),
        getGroupings(),
        getUsers(),
        getEventTypes(),
    ]);

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CalendarHeader currentDate={currentDate} view={view} />
                <div className="flex items-center gap-2">
                    <TeamAvailabilitySheet users={users} events={events} currentDate={currentDate} />
                    <CalendarFilters groupings={groupings} users={users} eventTypes={eventTypes} />
                    <GroupingManagementDialog groupings={groupings} eventTypes={eventTypes} />
                    <CreateEventDialog groupings={groupings} eventTypes={eventTypes} />
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                {view === "month" && <MonthView currentDate={currentDate} events={events} userId={session.user.id} groupings={groupings} eventTypes={eventTypes} />}
                {view === "week" && <WeekView currentDate={currentDate} events={events} userId={session.user.id} eventTypes={eventTypes} />}
                {view === "day" && <DayView currentDate={currentDate} events={events} userId={session.user.id} eventTypes={eventTypes} />}
            </div>
        </div>
    );
}
