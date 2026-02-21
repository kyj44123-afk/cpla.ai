import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const SECRET_KEY_PATH = path.join(process.cwd(), '.secret.key');

export class SecretsManager {
    private static key: Buffer;

    private static getKey(): Buffer {
        if (this.key) return this.key;

        // Priority 1: Environment variable (recommended for serverless)
        const envKey = process.env.ENCRYPTION_KEY;
        if (envKey) {
            this.key = Buffer.from(envKey, 'hex');
            return this.key;
        }

        // Priority 2: Disk-based key file (legacy/local dev)
        if (fs.existsSync(SECRET_KEY_PATH)) {
            const hexKey = fs.readFileSync(SECRET_KEY_PATH, 'utf-8');
            this.key = Buffer.from(hexKey, 'hex');
        } else {
            // Generate a new random key
            this.key = crypto.randomBytes(32); // 256 bits
            fs.writeFileSync(SECRET_KEY_PATH, this.key.toString('hex'));
            console.warn('[SecretsManager] Generated disk-based key. Set ENCRYPTION_KEY env var for production.');
        }

        return this.key;
    }

    static encrypt(text: string): string {
        const key = this.getKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Return IV:EncryptedText
        return `${iv.toString('hex')}:${encrypted}`;
    }

    static decrypt(text: string): string {
        try {
            const parts = text.split(':');
            if (parts.length !== 2) return text; // Not encrypted or invalid format

            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];
            const key = this.getKey();
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            console.error("Decryption failed:", e);
            return text; // Return original if decryption fails
        }
    }
}
