import { getUsers } from "@/features/admin/actions";
import { getGroupings, getGroupAdmins } from "@/features/calendar/actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { DeleteUserButton } from "./delete-user-button";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { GroupManagement } from "./group-management";

import { ActivityLog } from "./activity-log";
import { SystemSettings } from "./system-settings";
import { getWorkEmailDomains } from "@/features/settings/actions";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const session = await getSession();
    if (session?.user?.role !== "admin") {
        redirect("/");
    }

    const [users, groupings, workDomains] = await Promise.all([
        getUsers(),
        getGroupings(),
        getWorkEmailDomains(),
    ]);

    // Fetch admins for all groups
    const groupAdminsData: Record<string, any[]> = {};
    for (const group of groupings) {
        groupAdminsData[group.id] = await getGroupAdmins(group.id);
    }

    return (
        <div className="flex-1 p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users, groups, and system settings</p>
            </div>

            <div className="grid gap-8">
                {/* User Management */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">User Management</h2>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.role}</TableCell>
                                            <TableCell>{format(new Date(user.createdAt), "PPP")}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <ResetPasswordDialog
                                                        userId={user.id}
                                                        userName={user.name}
                                                        userEmail={user.email}
                                                    />
                                                    <DeleteUserButton userId={user.id} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Group Management */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Group Management</h2>
                    <GroupManagement
                        groupings={groupings}
                        users={users}
                        initialGroupAdmins={groupAdminsData}
                    />
                </div>

                {/* System Settings */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">System Settings</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <SystemSettings initialWorkDomains={workDomains} />
                        <ActivityLog />
                    </div>
                </div>
            </div>
        </div>
    );
}
