"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { addTeamMember } from "@/features/teams/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddMemberDialogProps {
    open: boolean;
    teamId: string;
    onOpenChange: (open: boolean) => void;
    onMemberAdded: () => void;
}

export function AddMemberDialog({ open, teamId, onOpenChange, onMemberAdded }: AddMemberDialogProps) {
    const [email, setEmail] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await addTeamMember(teamId, email, isAdmin);
            toast.success("Member added successfully");
            onOpenChange(false);
            setEmail("");
            setIsAdmin(false);
            onMemberAdded();
        } catch (error) {
            toast.error("Failed to add member: " + (error instanceof Error ? error.message : "Ensure user exists"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>User Email</Label>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            type="email"
                            required
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
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Add Member
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
