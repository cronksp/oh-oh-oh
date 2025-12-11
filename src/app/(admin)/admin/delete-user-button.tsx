"use client";

import { Button } from "@/components/ui/button";
import { deleteUser } from "@/features/admin/actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteUserButton({ userId }: { userId: string }) {
    async function handleDelete() {
        if (confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteUser(userId);
                toast.success("User deleted");
            } catch {
                toast.error("Failed to delete user");
            }
        }
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
