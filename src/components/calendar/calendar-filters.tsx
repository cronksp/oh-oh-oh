"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

import { UserSelector } from "@/components/user-selector";
import { EventType } from "@/lib/db/schema";

interface Grouping {
    id: string;
    name: string;
    color: string | null;
}

interface User {
    id: string;
    name: string;
}

interface CalendarFiltersProps {
    groupings: Grouping[];
    users: User[];
    eventTypes: EventType[];
}

export function CalendarFilters({ groupings, users, eventTypes }: CalendarFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const myStuffOnly = searchParams.get("myStuffOnly") === "true";
    const selectedGroupings = searchParams.get("groupings")?.split(",").filter(Boolean) || [];

    const createQueryString = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries(updates).forEach(([name, value]) => {
                if (value) {
                    params.set(name, value);
                } else {
                    params.delete(name);
                }
            });

            return params.toString();
        },
        [searchParams]
    );

    const toggleMyStuff = () => {
        const newValue = !myStuffOnly;
        router.push(`?${createQueryString({ myStuffOnly: newValue ? "true" : null })}`);
    };

    const toggleGrouping = (groupingId: string) => {
        let newGroupings = [...selectedGroupings];

        if (newGroupings.includes(groupingId)) {
            newGroupings = newGroupings.filter(id => id !== groupingId);
        } else {
            newGroupings.push(groupingId);
        }

        router.push(`?${createQueryString({
            groupings: newGroupings.length > 0 ? newGroupings.join(",") : null
        })}`);
    };

    const clearFilters = () => {
        router.push(`?${createQueryString({ myStuffOnly: null, groupings: null, filterUserId: null })}`);
    };

    const hasActiveFilters = myStuffOnly || selectedGroupings.length > 0 || !!searchParams.get("filterUserId");

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Filters</h4>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs">
                                Clear all
                            </Button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="myStuffOnly"
                                checked={myStuffOnly}
                                onCheckedChange={toggleMyStuff}
                            />
                            <Label htmlFor="myStuffOnly" className="text-sm cursor-pointer">
                                My Stuff Only
                            </Label>
                        </div>

                        <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Filter by User</p>
                            <UserSelector
                                users={users}
                                value={searchParams.get("filterUserId") || undefined}
                                onChange={(value) => {
                                    router.push(`?${createQueryString({ filterUserId: value || null })}`);
                                }}
                            />
                        </div>

                        {groupings.length > 0 && (
                            <>
                                <div className="border-t pt-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Groupings</p>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {groupings.map((grouping) => (
                                            <div key={grouping.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`grouping-${grouping.id}`}
                                                    checked={selectedGroupings.includes(grouping.id)}
                                                    onCheckedChange={() => toggleGrouping(grouping.id)}
                                                />
                                                <Label
                                                    htmlFor={`grouping-${grouping.id}`}
                                                    className="text-sm cursor-pointer flex items-center gap-2"
                                                >
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: grouping.color || "#3b82f6" }}
                                                    />
                                                    {grouping.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
