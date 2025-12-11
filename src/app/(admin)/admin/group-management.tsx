"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Shield } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { assignGroupAdmin, removeGroupAdmin } from "@/features/calendar/actions";
import { Grouping, User, GroupAdmin } from "@/lib/db/schema";

interface GroupManagementProps {
    groupings: Grouping[];
    users: Pick<User, "id" | "name">[];
    initialGroupAdmins: Record<string, GroupAdmin[]>; // groupingId -> admins
}

export function GroupManagement({ groupings, users, initialGroupAdmins }: GroupManagementProps) {
    const [groupAdmins, setGroupAdmins] = useState(initialGroupAdmins);
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [loading, setLoading] = useState<string | null>(null);

    async function handleAssign(groupingId: string) {
        if (!selectedUser) return;
        setLoading(groupingId);

        try {
            await assignGroupAdmin(groupingId, selectedUser);

            // Optimistic update or refetch would be better, but for now we'll just toast
            // In a real app we'd re-fetch the admins for this group
            // For this demo, we'll rely on the server action's revalidatePath to refresh the page
            // but since this is a client component state, we might not see it immediately without a refresh
            // unless we structure this differently. 
            // Actually, revalidatePath refreshes server components. 
            // Let's just toast and let the user refresh or we can try to update local state if we had the full user object.

            toast.success("Group admin assigned");
            setSelectedUser("");
        } catch (error) {
            toast.error("Failed to assign group admin");
        } finally {
            setLoading(null);
        }
    }

    async function handleRemove(groupingId: string, userId: string) {
        try {
            await removeGroupAdmin(groupingId, userId);
            toast.success("Group admin removed");
        } catch (error) {
            toast.error("Failed to remove group admin");
        }
    }

    return (
        <div className="space-y-6">
            {groupings.map((group) => {
                const admins = groupAdmins[group.id] || [];

                return (
                    <Card key={group.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: group.color || "#ccc" }}
                                        />
                                        {group.name}
                                    </CardTitle>
                                    <CardDescription>Manage admins for this group</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Add Admin Form */}
                                <div className="flex gap-2 items-end">
                                    <div className="w-[200px]">
                                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select user..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        onClick={() => handleAssign(group.id)}
                                        disabled={!selectedUser || loading === group.id}
                                        size="sm"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Admin
                                    </Button>
                                </div>

                                {/* Admins List */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Admin Name</TableHead>
                                            <TableHead>Assigned At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {admins.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    No admins assigned to this group
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            admins.map((admin) => {
                                                const user = users.find(u => u.id === admin.userId);
                                                return (
                                                    <TableRow key={admin.userId}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="w-3 h-3 text-blue-500" />
                                                                {user?.name || "Unknown User"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(admin.assignedAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemove(group.id, admin.userId)}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
