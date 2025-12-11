import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.SYSTEM_MASTER_KEY || "default-secret-key-change-me";
const key = new TextEncoder().encode(SECRET_KEY);

interface SessionPayload extends JWTPayload {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    expires: Date;
}

export async function encrypt(payload: SessionPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    // Refresh session if needed, for now just return response
    const parsed = await decrypt(session);

    if (!parsed) {
        return;
    }

    // Extend expiration logic could go here

    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: session,
        httpOnly: true,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return res;
}

export async function login(userData: SessionPayload["user"]) {
    // Create the session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user: userData, expires });

    // Save the session in a cookie
    const cookieStore = await cookies();
    cookieStore.set("session", session, { expires, httpOnly: true });
}

export async function logout() {
    // Destroy the session
    const cookieStore = await cookies();
    cookieStore.set("session", "", { expires: new Date(0) });
}
