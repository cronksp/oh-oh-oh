import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { addTeamMembers } from "@/features/teams/actions";
import { getUsers } from "@/features/users/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

interface AddMemberDialogProps {
    open: boolean;
    teamId: string;
    onOpenChange: (open: boolean) => void;
    onMemberAdded: () => void;
}

export function AddMemberDialog({ open, teamId, onOpenChange, onMemberAdded }: AddMemberDialogProps) {
    const [userIds, setUserIds] = useState<string[]>([]);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        getUsers().then(setUsers);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userIds.length === 0) {
            toast.error("Please select at least one user");
            return;
        }

        setIsLoading(true);
        try {
            await addTeamMembers(teamId, userIds, isAdmin);
            toast.success(`${userIds.length} member(s) added successfully`);
            onOpenChange(false);
            setUserIds([]);
            setIsAdmin(false);
            onMemberAdded();
        } catch (error) {
            toast.error("Failed to add members: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-visible min-h-[300px]">
                <DialogHeader>
                    <DialogTitle>Add Team Members</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Users</Label>
                        <MultiSelect
                            options={users.map(u => ({ label: u.name, value: u.id }))}
                            selected={userIds}
                            onChange={setUserIds}
                            placeholder="Search and select users..."
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="admin"
                            checked={isAdmin}
                            onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                        />
                        <Label htmlFor="admin">Make Team Admin</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || userIds.length === 0}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Add Members
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
