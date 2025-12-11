"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface User {
    id: string;
    name: string;
}

interface UserSelectorProps {
    users: User[];
    value?: string;
    onChange: (value: string | undefined) => void;
    placeholder?: string;
}

export function UserSelector({ users, value, onChange, placeholder = "Select user..." }: UserSelectorProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? users.find((user) => user.id === value)?.name
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="all"
                                onSelect={() => {
                                    onChange(undefined);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        !value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                All Users
                            </CommandItem>
                            {users.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    value={user.name}
                                    onSelect={() => {
                                        onChange(user.id === value ? undefined : user.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === user.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {user.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
