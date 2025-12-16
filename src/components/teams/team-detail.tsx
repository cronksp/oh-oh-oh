"use client";

import { useState, useEffect } from "react";
import { Team } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, UserMinus, Shield, ShieldAlert, Loader2 } from "lucide-react";
import { getTeamMembers, removeTeamMember, updateMemberRole, addTeamMember } from "@/features/teams/actions";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateTeamDialog } from "./create-team-dialog";
import { AddMemberDialog } from "./add-member-dialog";

interface TeamDetailProps {
    team: Team;
}

interface Member {
    userId: string;
    name: string;
    email: string;
    isAdmin: boolean;
}

export function TeamDetail({ team }: TeamDetailProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSubTeamDialog, setShowSubTeamDialog] = useState(false);
    const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getTeamMembers(team.id)
            .then(data => setMembers(data))
            .finally(() => setIsLoading(false));
    }, [team.id]);

    const handleRemoveMember = async (userId: string) => {
        try {
            await removeTeamMember(team.id, userId);
            setMembers(members.filter(m => m.userId !== userId));
            toast.success("Member removed");
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    const handleToggleAdmin = async (member: Member) => {
        try {
            await updateMemberRole(team.id, member.userId, !member.isAdmin);
            setMembers(members.map(m => m.userId === member.userId ? { ...m, isAdmin: !m.isAdmin } : m));
            toast.success(member.isAdmin ? "Admin rights revoked" : "Promoted to Admin");
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {team.name}
                        {team.isPrivate && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Private</span>}
                    </h2>
                    <p className="text-slate-500 text-sm">Created on {new Date(team.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    {!team.isPrivate && (
                        <Button variant="outline" onClick={() => setShowSubTeamDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Sub-Team
                        </Button>
                    )}
                    <Button onClick={() => setShowAddMemberDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Members List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-semibold text-lg">Members ({members.length})</h3>
                        {isLoading ? (
                            <div className="text-sm text-slate-500">Loading members...</div>
                        ) : (
                            <div className="space-y-2">
                                {members.map(member => (
                                    <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                        <div>
                                            <div className="font-medium flex items-center gap-1">
                                                {member.name}
                                                {member.isAdmin && <Shield className="h-3 w-3 text-blue-500" />}
                                            </div>
                                            <div className="text-xs text-slate-500">{member.email}</div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleToggleAdmin(member)}>
                                                    {member.isAdmin ? (
                                                        <>
                                                            <ShieldAlert className="h-4 w-4 mr-2" />
                                                            Revoke Admin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Shield className="h-4 w-4 mr-2" />
                                                            Make Admin
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member.userId)}>
                                                    <UserMinus className="h-4 w-4 mr-2" />
                                                    Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Team Calendar / Context */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-semibold text-lg">Team Activity</h3>
                        <div className="border rounded-lg p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                            Combined availability view coming soon...
                        </div>
                    </div>
                </div>
            </div>

            <CreateTeamDialog
                open={showSubTeamDialog}
                type="sub"
                parentTeamId={team.id}
                onOpenChange={setShowSubTeamDialog}
            />

            <AddMemberDialog
                open={showAddMemberDialog}
                teamId={team.id}
                onOpenChange={setShowAddMemberDialog}
                onMemberAdded={() => getTeamMembers(team.id).then(setMembers)}
            />
        </div>
    );
}
