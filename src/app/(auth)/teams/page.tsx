import { getTeams } from "@/features/teams/actions";
import { TeamsDashboard } from "@/components/teams/teams-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Teams",
};

export default async function TeamsPage() {
    // getTeams returns { publicTeams, myPrivateTeams }
    const { publicTeams, myPrivateTeams } = await getTeams();

    return (
        <div className="h-full flex flex-col p-4">
            <h1 className="text-2xl font-bold mb-4">Teams & Organization</h1>
            <div className="flex-1 min-h-0 border rounded-lg bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                <TeamsDashboard
                    initialPublicTeams={publicTeams}
                    initialPrivateTeams={myPrivateTeams}
                />
            </div>
        </div>
    );
}
