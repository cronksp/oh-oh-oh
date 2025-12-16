"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Settings, Shield, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LogoutButton } from "@/components/logout-button";
import { getMe } from "@/features/users/actions";
import { useState, useEffect } from "react";

const navItems = [
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<{ role: "admin" | "user" } | null>(null);

    useEffect(() => {
        getMe().then((u) => {
            if (u) setUser(u as any);
        });
    }, []);

    const filteredNavItems = navItems.filter(item => {
        if (item.adminOnly) {
            return user?.role === "admin";
        }
        return true;
    });

    return (
        <aside className="hidden w-64 flex-col border-r bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl md:flex">
            <div className="flex h-14 items-center border-b px-6">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                    Whereabouts
                </span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
                    <ModeToggle />
                </div>
                <LogoutButton />
            </div>
        </aside>
    );
}
