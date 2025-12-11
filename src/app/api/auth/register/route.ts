import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { generateUserKey, encryptUserKey } from "@/lib/crypto";
import { login } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email));

        if (existingUser.length > 0) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate and encrypt user key
        const userKey = generateUserKey();
        const encryptedPrivateKey = encryptUserKey(userKey);

        // Create user
        const [newUser] = await db.insert(users).values({
            email,
            passwordHash,
            name,
            role: "user", // Default role
            encryptedPrivateKey,
        }).returning();

        // Login (create session)
        await login({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
        });

        logger.info({ userId: newUser.id }, "User registered successfully");

        return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
    } catch (error) {
        logger.error(error, "Registration error");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
