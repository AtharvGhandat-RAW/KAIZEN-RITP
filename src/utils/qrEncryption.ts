import CryptoJS from 'crypto-js';

// Secret key for encryption - in production, use environment variable
const SECRET_KEY = import.meta.env.VITE_QR_SECRET_KEY || 'kaizen-ritp-2025-secret-key';

export interface QRPayload {
    registrationId: string;
    eventId: string;
    name: string;
    email: string;
    phone: string;
    eventName: string;
    timestamp: number;
    expiresAt: number;
}

// Compact payload for QR (shorter data = easier to scan)
interface CompactQRData {
    r: string;  // registrationId
    e: string;  // eventId
    n: string;  // name
    t: number;  // timestamp
    s: string;  // signature (short)
}

/**
 * Encrypts QR data using a compact format for better scanning
 */
export function encryptQRData(payload: QRPayload): string {
    // Create compact data
    const compact: CompactQRData = {
        r: payload.registrationId,
        e: payload.eventId,
        n: payload.name,
        t: payload.timestamp,
        s: '' // will be set below
    };

    // Create short signature
    const sigData = `${compact.r}|${compact.e}|${compact.t}`;
    compact.s = CryptoJS.HmacSHA256(sigData, SECRET_KEY).toString().substring(0, 16);

    // Simple encoding - JSON + base64 (no AES for shorter result)
    const jsonStr = JSON.stringify(compact);

    // Use URL-safe base64
    return btoa(jsonStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decrypts and verifies QR data
 */
export function decryptQRData(encryptedData: string): QRPayload | null {
    try {
        // Handle URL-safe base64
        let base64 = encryptedData.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }

        // Decode
        const jsonStr = atob(base64);
        const compact: CompactQRData = JSON.parse(jsonStr);

        // Verify signature
        const sigData = `${compact.r}|${compact.e}|${compact.t}`;
        const expectedSig = CryptoJS.HmacSHA256(sigData, SECRET_KEY).toString().substring(0, 16);

        if (compact.s !== expectedSig) {
            console.error('QR signature verification failed');
            return null;
        }

        // Convert to full payload
        return {
            registrationId: compact.r,
            eventId: compact.e,
            name: compact.n,
            email: '',
            phone: '',
            eventName: '',
            timestamp: compact.t,
            expiresAt: compact.t + (30 * 24 * 60 * 60 * 1000) // 30 days
        };
    } catch (error) {
        console.error('Error decrypting QR data:', error);

        // Try legacy format (old encrypted QR codes)
        return decryptLegacyQRData(encryptedData);
    }
}

/**
 * Decrypts old format QR codes for backward compatibility
 */
function decryptLegacyQRData(encryptedData: string): QRPayload | null {
    try {
        const encrypted = atob(encryptedData);
        const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
        const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

        if (!decryptedString) {
            return null;
        }

        const { data, sig } = JSON.parse(decryptedString);
        const expectedSignature = CryptoJS.HmacSHA256(data, SECRET_KEY).toString();

        if (sig !== expectedSignature) {
            return null;
        }

        return JSON.parse(data);
    } catch {
        return null;
    }
}

/**
 * Creates a QR payload for a registration
 */
export function createQRPayload(
    registration: {
        id: string;
        event_id: string;
        name: string;
        email: string;
        phone?: string;
    },
    eventName: string,
    expirationDays: number = 30
): QRPayload {
    const now = Date.now();
    const expiresAt = now + (expirationDays * 24 * 60 * 60 * 1000);

    return {
        registrationId: registration.id,
        eventId: registration.event_id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone || '',
        eventName: eventName,
        timestamp: now,
        expiresAt: expiresAt
    };
}

/**
 * Validates a QR payload structure
 */
export function isValidQRPayload(payload: unknown): payload is QRPayload {
    if (!payload || typeof payload !== 'object') return false;

    const p = payload as Record<string, unknown>;

    return (
        typeof p.registrationId === 'string' &&
        typeof p.eventId === 'string' &&
        typeof p.name === 'string' &&
        typeof p.email === 'string' &&
        typeof p.timestamp === 'number'
    );
}

/**
 * Generates a simple verification hash for display on pass
 */
export function generateVerificationCode(registrationId: string): string {
    const hash = CryptoJS.SHA256(registrationId + SECRET_KEY).toString();
    return hash.substring(0, 8).toUpperCase();
}
