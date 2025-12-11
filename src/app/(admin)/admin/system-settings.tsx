"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateWorkEmailDomains } from "@/features/settings/actions";
import { toast } from "sonner";
import { X, Plus, Loader2 } from "lucide-react";

interface SystemSettingsProps {
    initialWorkDomains: string[];
}

export function SystemSettings({ initialWorkDomains }: SystemSettingsProps) {
    const [domains, setDomains] = useState<string[]>(initialWorkDomains);
    const [newDomain, setNewDomain] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        setLoading(true);
        try {
            await updateWorkEmailDomains(domains);
            toast.success("Work domains updated");
        } catch (error) {
            toast.error("Failed to update domains");
        } finally {
            setLoading(false);
        }
    }

    function addDomain() {
        if (!newDomain) return;
        const domain = newDomain.toLowerCase().trim();
        if (domains.includes(domain)) {
            toast.error("Domain already exists");
            return;
        }
        setDomains([...domains, domain]);
        setNewDomain("");
    }

    function removeDomain(domainToRemove: string) {
        setDomains(domains.filter(d => d !== domainToRemove));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Work Email Domains</CardTitle>
                <CardDescription>
                    Users with verified emails from these domains will get a special "Work Verified" badge.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="e.g. acme.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addDomain()}
                    />
                    <Button onClick={addDomain} size="icon" variant="outline">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {domains.map((domain) => (
                        <div key={domain} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                            {domain}
                            <button onClick={() => removeDomain(domain)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {domains.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No domains configured</p>
                    )}
                </div>

                <div className="pt-2">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
