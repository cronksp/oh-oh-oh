"use client";

import { useState } from "react";
import { getActivityLog } from "@/features/calendar/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Calendar, User, CheckCircle, XCircle, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityLogItem {
    id: string;
    action: string;
    entityType: string;
    details: string | null;
    createdAt: Date;
    userName: string | null;
    userEmail: string | null;
    title: string | null; // Event title
}

interface ActivityListProps {
    initialLogs: ActivityLogItem[];
}

export function ActivityList({ initialLogs }: ActivityListProps) {
    const [logs, setLogs] = useState<ActivityLogItem[]>(initialLogs);
    const [filter, setFilter] = useState<"all" | "public">("all");
    const [loading, setLoading] = useState(false);

    const handleFilterChange = async (value: "all" | "public") => {
        setFilter(value);
        setLoading(true);
        try {
            const newLogs = await getActivityLog(value);
            setLogs(newLogs);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (action: string) => {
        switch (action) {
            case "create_event": return <Calendar className="h-4 w-4 text-blue-500" />;
            case "rsvp_event": return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "update_event": return <Edit className="h-4 w-4 text-orange-500" />;
            default: return <User className="h-4 w-4 text-slate-500" />;
        }
    };

    const formatDetails = (log: ActivityLogItem) => {
        try {
            const details = log.details ? JSON.parse(log.details) : {};
            if (log.action === "create_event") {
                return <span>created event <span className="font-medium text-foreground">{details.title || log.title || "Untitled"}</span></span>;
            }
            if (log.action === "update_event") {
                return <span>updated event <span className="font-medium text-foreground">{details.title || log.title}</span></span>;
            }
            if (log.action === "rsvp_event") {
                return <span>responded <strong>{details.status}</strong> to <span className="font-medium text-foreground">{log.title}</span></span>;
            }
            return <span>performed {log.action}</span>;
        } catch (e) {
            return <span>performed {log.action}</span>;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Recent Activity
                </CardTitle>
                <div className="flex items-center space-x-2">
                    <Select value={filter} onValueChange={(v) => handleFilterChange(v as "all" | "public")}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Activity</SelectItem>
                            <SelectItem value="public">Public Events Only</SelectItem>
                        </SelectContent>
                    </Select>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 pt-4">
                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No recent activity found.</p>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex items-start space-x-4 border-b pb-4 last:border-0 last:pb-0">
                                <div className="mt-1 bg-muted p-2 rounded-full">
                                    {getIcon(log.action)}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground leading-none">
                                        <span className="font-semibold text-foreground">{log.userName || log.userEmail || "Unknown User"}</span> {formatDetails(log)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
