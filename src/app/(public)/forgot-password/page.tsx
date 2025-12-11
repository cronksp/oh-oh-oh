"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requestPasswordReset, resetPasswordWithCode } from "@/features/settings/actions";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRequestCode(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await requestPasswordReset(email);
            toast.success("If an account exists, a code has been sent.");
            setStep("code");
        } catch (error) {
            toast.error("Failed to request code");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        setLoading(true);
        try {
            await resetPasswordWithCode(email, code, newPassword);
            toast.success("Password reset successfully! Please login.");
            router.push("/login");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reset password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>
                        {step === "email"
                            ? "Enter your email to receive a reset code"
                            : `Enter the code sent to ${email}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === "email" ? (
                        <form onSubmit={handleRequestCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Code
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Verification Code</Label>
                                <Input
                                    id="code"
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Min 8 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={8}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reset Password
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={() => setStep("email")}
                            >
                                Back to Email
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
