"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeam } from "@/features/teams/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTeamDialogProps {
    open: boolean;
    type: "root" | "private" | "sub" | null; // Added "sub" for sub-teams
    parentTeamId?: string;
    onOpenChange: (open: boolean) => void;
}

export function CreateTeamDialog({ open, type, parentTeamId, onOpenChange }: CreateTeamDialogProps) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createTeam({
                name,
                parentTeamId: type === "sub" ? parentTeamId : undefined,
                isPrivate: type === "private",
            });
            toast.success("Team created successfully");
            onOpenChange(false);
            setName("");
        } catch (error) {
            toast.error("Failed to create team: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    const title = type === "root" ? "Create Public Root Team" : type === "private" ? "Create Private Group" : "Create Sub-Team";
    const desc = type === "root" ? "This team will be visible to everyone at the top level." : type === "private" ? "Only you and members you invite can see this group." : "This team will be nested under the parent team.";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <div className="text-sm text-slate-500">{desc}</div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Team Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Engineering"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Team
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
