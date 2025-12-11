import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { login } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        // Find user
        const [user] = await db.select().from(users).where(eq(users.email, email));

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Login (create session)
        await login({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        logger.info({ userId: user.id }, "User logged in");

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        logger.error(error, "Login error");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
