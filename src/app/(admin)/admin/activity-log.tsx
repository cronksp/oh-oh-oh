"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getActivityLog } from "@/features/logging/actions";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function ActivityLog() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const data = await getActivityLog({ limit: 20 });
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent system activities</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                    {format(new Date(log.createdAt), "MM/dd HH:mm")}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                    {log.userName || log.userEmail || "Unknown"}
                                </TableCell>
                                <TableCell className="text-sm font-mono">
                                    {log.action}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                    {log.details}
                                </TableCell>
                            </TableRow>
                        ))}
                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No activity recorded
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
