"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetUserPassword } from "@/features/admin/actions";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

interface ResetPasswordDialogProps {
    userId: string;
    userName: string;
    userEmail: string;
}

export function ResetPasswordDialog({ userId, userName, userEmail }: ResetPasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleReset() {
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await resetUserPassword(userId, newPassword);
            toast.success(`Password reset for ${userName}`);
            setOpen(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reset password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
            >
                <KeyRound className="h-4 w-4 mr-2" />
                Reset Password
            </Button>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for <strong>{userName}</strong> ({userEmail})
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={8}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={8}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleReset} disabled={loading}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
