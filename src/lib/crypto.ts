import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Recommended for GCM

const SYSTEM_MASTER_KEY_HEX = process.env.SYSTEM_MASTER_KEY;

if (!SYSTEM_MASTER_KEY_HEX && process.env.NODE_ENV === "production") {
    console.warn("SYSTEM_MASTER_KEY is not set! Encryption will fail.");
}

// Helper to get master key buffer
function getMasterKey(): Buffer {
    if (!SYSTEM_MASTER_KEY_HEX) {
        throw new Error("SYSTEM_MASTER_KEY is missing");
    }
    return Buffer.from(SYSTEM_MASTER_KEY_HEX, "hex");
}

export function generateUserKey(): string {
    return randomBytes(32).toString("hex");
}

// Encrypts the User Data Key using the System Master Key
export function encryptUserKey(userKeyHex: string): string {
    const masterKey = getMasterKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, masterKey, iv);

    let encrypted = cipher.update(userKeyHex, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Format: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

// Decrypts the User Data Key using the System Master Key
export function decryptUserKey(encryptedUserKey: string): string {
    const masterKey = getMasterKey();
    const [ivHex, authTagHex, encryptedHex] = encryptedUserKey.split(":");

    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error("Invalid encrypted key format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, masterKey, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

// Encrypts arbitrary text data using the User Data Key
export function encryptData(text: string, userKeyHex: string): string {
    const userKey = Buffer.from(userKeyHex, "hex");
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, userKey, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

// Decrypts arbitrary text data using the User Data Key
export function decryptData(encryptedText: string, userKeyHex: string): string {
    const userKey = Buffer.from(userKeyHex, "hex");
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":");

    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, userKey, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
