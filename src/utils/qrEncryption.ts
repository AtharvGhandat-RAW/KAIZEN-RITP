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

/**
 * Encrypts QR data using AES encryption with HMAC signature
 */
export function encryptQRData(payload: QRPayload): string {
    const payloadString = JSON.stringify(payload);

    // Create HMAC signature for integrity verification
    const signature = CryptoJS.HmacSHA256(payloadString, SECRET_KEY).toString();

    // Combine payload with signature
    const dataWithSignature = JSON.stringify({
        data: payloadString,
        sig: signature
    });

    // Encrypt the combined data
    const encrypted = CryptoJS.AES.encrypt(dataWithSignature, SECRET_KEY).toString();

    // Base64 encode for QR compatibility
    return btoa(encrypted);
}

/**
 * Decrypts and verifies QR data
 */
export function decryptQRData(encryptedData: string): QRPayload | null {
    try {
        // Base64 decode
        const encrypted = atob(encryptedData);

        // Decrypt
        const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
        const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

        if (!decryptedString) {
            console.error('Failed to decrypt QR data');
            return null;
        }

        // Parse the data with signature
        const { data, sig } = JSON.parse(decryptedString);

        // Verify signature
        const expectedSignature = CryptoJS.HmacSHA256(data, SECRET_KEY).toString();
        if (sig !== expectedSignature) {
            console.error('QR signature verification failed');
            return null;
        }

        // Parse and return payload
        const payload: QRPayload = JSON.parse(data);

        // Check expiration
        if (payload.expiresAt && Date.now() > payload.expiresAt) {
            console.error('QR code has expired');
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Error decrypting QR data:', error);
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
