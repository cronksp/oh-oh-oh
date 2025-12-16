"use client";

import { useState, useMemo } from "react";
import { Team } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, ChevronDown, Users, Lock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateTeamDialog } from "./create-team-dialog";

interface TeamsSidebarProps {
    publicTeams: Team[];
    privateTeams: Team[];
    selectedId?: string;
    onSelect: (team: Team) => void;
}

export function TeamsSidebar({ publicTeams, privateTeams, selectedId, onSelect }: TeamsSidebarProps) {
    const [createType, setCreateType] = useState<"root" | "private" | null>(null);

    // Build hierarchy for public teams
    const rootPublicTeams = useMemo(() => {
        const roots = publicTeams.filter(t => !t.parentTeamId);
        // We need a map for quick lookup of children? 
        // Or just recursive rendering fn that filters publicTeams.
        return roots;
    }, [publicTeams]);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">Organization</span>
                {/* Only Admin sees this, but we'll handle permissions in the dialog/action */}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCreateType("root")}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-6">
                {/* Public Hierarchy */}
                <div>
                    <h3 className="text-xs font-medium text-slate-500 mb-2 px-2 uppercase tracking-wider">Org Chart</h3>
                    <div className="space-y-0.5">
                        {rootPublicTeams.map(team => (
                            <TeamTreeItem
                                key={team.id}
                                team={team}
                                allTeams={publicTeams}
                                selectedId={selectedId}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                </div>

                {/* Private Groups */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">My Groups</h3>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setCreateType("private")}>
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="space-y-0.5">
                        {privateTeams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => onSelect(team)}
                                className={cn(
                                    "w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors",
                                    selectedId === team.id
                                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <Lock className="h-3 w-3 mr-2 opacity-50" />
                                <span className="truncate">{team.name}</span>
                            </button>
                        ))}
                        {privateTeams.length === 0 && (
                            <div className="px-2 text-xs text-slate-400 italic">No private groups</div>
                        )}
                    </div>
                </div>
            </div>

            <CreateTeamDialog
                open={!!createType}
                type={createType}
                onOpenChange={(open) => !open && setCreateType(null)}
            />
        </div>
    );
}

function TeamTreeItem({ team, allTeams, selectedId, onSelect, depth = 0 }: {
    team: Team,
    allTeams: Team[],
    selectedId?: string,
    onSelect: (t: Team) => void,
    depth?: number
}) {
    const [expanded, setExpanded] = useState(true);
    const children = allTeams.filter(t => t.parentTeamId === team.id);
    const hasChildren = children.length > 0;

    return (
        <div>
            <button
                onClick={() => onSelect(team)}
                className={cn(
                    "w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors group",
                    selectedId === team.id
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {hasChildren ? (
                    <div
                        role="button"
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="mr-1 p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </div>
                ) : (
                    <div className="w-4 mr-1" />
                )}
                <Users className="h-3 w-3 mr-2 opacity-50" />
                <span className="truncate">{team.name}</span>
            </button>

            {expanded && hasChildren && (
                <div>
                    {children.map(child => (
                        <TeamTreeItem
                            key={child.id}
                            team={child}
                            allTeams={allTeams}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
