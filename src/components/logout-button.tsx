"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
            toast.success("Logged out");
        } catch {
            // Ignore error
            toast.error("Failed to logout");
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
    );
}
