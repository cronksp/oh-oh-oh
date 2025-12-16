"use client";

import { useState } from "react";
import { Team } from "@/lib/db/schema";
import { TeamsSidebar } from "./teams-sidebar";
import { TeamDetail } from "./team-detail";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
// Wait, I don't have resizable in the list. I'll just use flex layout.

export function TeamsDashboard({
    initialPublicTeams,
    initialPrivateTeams
}: {
    initialPublicTeams: Team[],
    initialPrivateTeams: Team[]
}) {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [publicTeams, setPublicTeams] = useState(initialPublicTeams);
    const [privateTeams, setPrivateTeams] = useState(initialPrivateTeams);

    return (
        <div className="flex h-full">
            <div className="w-80 border-r flex flex-col bg-slate-50 dark:bg-slate-900/50">
                <TeamsSidebar
                    publicTeams={publicTeams}
                    privateTeams={privateTeams}
                    selectedId={selectedTeam?.id}
                    onSelect={setSelectedTeam}
                />
            </div>
            <div className="flex-1 min-h-0 min-w-0">
                {selectedTeam ? (
                    <TeamDetail team={selectedTeam} />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        Select a team to view details
                    </div>
                )}
            </div>
        </div>
    );
}
