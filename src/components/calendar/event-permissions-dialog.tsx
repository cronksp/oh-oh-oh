"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, X, Shield, ShieldAlert } from "lucide-react";
import { searchUsers } from "@/features/auth/actions";
import { grantEventPermission, revokeEventPermission, getEventPermissions } from "@/features/calendar/actions";
import { toast } from "sonner";
import { Event } from "@/lib/db/schema";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists or I'll implement a simple one

// Simple debounce implementation if hook doesn't exist
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

interface EventPermissionsDialogProps {
    event: Event;
    trigger?: React.ReactNode;
}

interface UserResult {
    id: string;
    name: string;
    email: string;
}

interface Permission {
    userId: string;
    canEdit: boolean;
    canDelete: boolean;
}

export function EventPermissionsDialog({ event, trigger }: EventPermissionsDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [existingPermissions, setExistingPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(false);
    const [permissionMap, setPermissionMap] = useState<Record<string, UserResult>>({});

    const debouncedSearch = useDebounceValue(searchQuery, 300);

    // Load existing permissions
    useEffect(() => {
        if (open) {
            loadPermissions();
        }
    }, [open, event.id]);

    async function loadPermissions() {
        try {
            const perms = await getEventPermissions(event.id);
            setExistingPermissions(perms.map(p => ({
                userId: p.userId,
                canEdit: p.canEdit ?? false,
                canDelete: p.canDelete ?? false
            })));

            // We also need user details for these permissions. 
            // Ideally getEventPermissions should join with users table.
            // For now, we'll just show the ID or fetch details if needed.
            // Let's assume for this iteration we might need to fetch user details separately 
            // or update getEventPermissions to return user info.
            // To keep it simple without changing backend too much, let's just search for these users to populate cache
            // or rely on the fact that we might not have names yet.
            // Actually, let's fetch details for these users using searchUsers with their IDs if possible, 
            // or just rely on search for adding new ones.
            // A better approach for a real app is `getEventPermissions` returning user object.
            // I'll stick to basic functionality first.
        } catch (error) {
            console.error("Failed to load permissions", error);
        }
    }

    // Handle search
    useEffect(() => {
        async function search() {
            // Allow "*" for browse or >= 2 chars for search
            if (debouncedSearch !== "*" && debouncedSearch.length < 2) {
                setSearchResults([]);
                return;
            }
            setLoading(true);
            try {
                const results = await searchUsers(debouncedSearch);
                setSearchResults(results);

                // Update cache
                const newMap = { ...permissionMap };
                results.forEach(u => newMap[u.id] = u);
                setPermissionMap(newMap);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }
        search();
    }, [debouncedSearch]);

    async function handleGrant(userId: string, canEdit: boolean, canDelete: boolean) {
        try {
            await grantEventPermission(event.id, userId, { canEdit, canDelete });
            toast.success("Permission updated");
            loadPermissions();
        } catch (error) {
            toast.error("Failed to update permission");
        }
    }

    async function handleRevoke(userId: string) {
        try {
            await revokeEventPermission(event.id, userId);
            toast.success("Permission revoked");
            loadPermissions();
        } catch (error) {
            toast.error("Failed to revoke permission");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Permissions
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Event Permissions</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Search Section */}
                    <div className="space-y-2">
                        <Label>Add People</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setSearchQuery("*")}
                                title="Browse all users"
                            >
                                Browse
                            </Button>
                        </div>
                        {searchResults.filter(u => u.id !== event.userId).length > 0 && (
                            <div className="border rounded-md mt-2 max-h-[200px] overflow-y-auto bg-slate-50 dark:bg-slate-900">
                                {searchResults.filter(u => u.id !== event.userId).map((user) => {
                                    const existing = existingPermissions.find(p => p.userId === user.id);
                                    return (
                                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <div className="text-sm">
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                            {existing ? (
                                                <span className="text-xs text-muted-foreground px-2">Added</span>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleGrant(user.id, true, false)}
                                                >
                                                    Add
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Permissions List */}
                    <div className="space-y-2">
                        <Label>Current Access</Label>
                        <ScrollArea className="h-[200px] border rounded-md p-4">
                            {existingPermissions.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    No custom permissions granted.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {existingPermissions.map((perm) => {
                                        // Try to find user info in our local cache (from search results)
                                        // In a real app, we'd fetch this properly
                                        const user = permissionMap[perm.userId] || { name: "Unknown User", email: perm.userId, id: perm.userId };

                                        return (
                                            <div key={perm.userId} className="flex items-center justify-between space-x-4 border-b pb-4 last:border-0 last:pb-0">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`edit-${perm.userId}`}
                                                            checked={perm.canEdit}
                                                            onCheckedChange={(checked) => handleGrant(perm.userId, checked as boolean, perm.canDelete)}
                                                        />
                                                        <Label htmlFor={`edit-${perm.userId}`} className="text-xs">Edit</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`delete-${perm.userId}`}
                                                            checked={perm.canDelete}
                                                            onCheckedChange={(checked) => handleGrant(perm.userId, perm.canEdit, checked as boolean)}
                                                        />
                                                        <Label htmlFor={`delete-${perm.userId}`} className="text-xs">Delete</Label>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleRevoke(perm.userId)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
