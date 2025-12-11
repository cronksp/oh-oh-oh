import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm } from "./profile-form";
import { getWorkEmailDomains } from "@/features/settings/actions";

import { ModeToggle } from "@/components/ui/mode-toggle";

export default async function SettingsPage() {
    const session = await getSession();
    if (!session?.user) redirect("/login");

    const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
    const workDomains = await getWorkEmailDomains();

    if (!user) redirect("/login");

    return (
        <div className="flex-1 p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <div className="grid gap-6">
                {/* User Profile */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Your account details and verification status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm
                            user={{
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                emailVerified: user.emailVerified
                            }}
                            workDomains={workDomains}
                        />
                    </CardContent>
                </Card>

                {/* Theme */}
                <Card>
                    <CardHeader>
                        <CardTitle>Theme</CardTitle>
                        <CardDescription>Manage your theme preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <ModeToggle />
                        <p className="text-sm text-muted-foreground">
                            Switch between light and dark mode
                        </p>
                    </CardContent>
                </Card>

                {/* Password - Coming Soon */}
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChangePasswordForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
