"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile, sendVerificationCode, verifyEmail } from "@/features/settings/actions";
import { Check, ShieldCheck, BadgeCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
    user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
    };
    workDomains: string[];
}

export function ProfileForm({ user, workDomains }: ProfileFormProps) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [loading, setLoading] = useState(false);

    // Verification state
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState("");
    const [showCodeInput, setShowCodeInput] = useState(false);

    const isWorkEmail = workDomains.some(domain => email.endsWith(`@${domain}`));
    const isVerified = user.emailVerified && user.email === email; // Only verified if email hasn't changed

    async function handleUpdateProfile() {
        setLoading(true);
        try {
            await updateProfile({ name, email });
            toast.success("Profile updated");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setLoading(false);
        }
    }

    async function handleSendCode() {
        setVerifying(true);
        try {
            await sendVerificationCode();
            toast.success("Verification code sent to your email");
            setShowCodeInput(true);
        } catch (error) {
            toast.error("Failed to send code");
        } finally {
            setVerifying(false);
        }
    }

    async function handleVerifyCode() {
        setVerifying(true);
        try {
            await verifyEmail(code);
            toast.success("Email verified successfully!");
            setShowCodeInput(false);
            setCode("");
        } catch (error) {
            toast.error("Invalid verification code");
        } finally {
            setVerifying(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label htmlFor="email">Email</Label>
                    {isVerified && (
                        isWorkEmail ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" />
                                Work Verified
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                            </span>
                        )
                    )}
                </div>
                <div className="flex gap-2">
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>
                {!isVerified && user.email === email && (
                    <div className="pt-2">
                        {!showCodeInput ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSendCode}
                                disabled={verifying}
                            >
                                {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify Email
                            </Button>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <Input
                                    placeholder="Enter 6-digit code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-40"
                                    maxLength={6}
                                />
                                <Button
                                    size="sm"
                                    onClick={handleVerifyCode}
                                    disabled={verifying || code.length !== 6}
                                >
                                    {verifying ? "Verifying..." : "Confirm"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCodeInput(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Verify your email to get a verified badge.
                        </p>
                    </div>
                )}
            </div>

            <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
    );
}
