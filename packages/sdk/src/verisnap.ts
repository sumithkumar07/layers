import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export interface VeriSnapConfig {
    apiKey: string;
    baseUrl?: string;
}

export interface ScanOptions {
    image: string | Buffer | fs.ReadStream; // Path, Buffer, or Stream
    challenge?: number; // For liveness
}

export interface ScanResult {
    isFraud: boolean;
    score: number;
    flags: string[];
    details: any;
}

export class VeriSnap {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: VeriSnapConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || "http://127.0.0.1:8000"; // Default to local for now
    }

    /**
     * Scans an image for manipulation and fraud.
     */
    async scan(options: ScanOptions): Promise<ScanResult> {
        const formData = new FormData();

        if (typeof options.image === 'string') {
            // Assume it's a file path
            formData.append('file', fs.createReadStream(options.image));
        } else {
            formData.append('file', options.image);
        }

        if (options.challenge) {
            formData.append('challenge', options.challenge.toString());
        }

        const endpoint = options.challenge ? '/images/liveness' : '/images/verify';
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await axios.post(url, formData, {
                headers: {
                    'X-API-Key': this.apiKey,
                    ...formData.getHeaders()
                }
            });

            const data = response.data;

            // Normalize response
            if (options.challenge) {
                return {
                    isFraud: data.status === 'FAIL',
                    score: data.status === 'PASS' ? 100 : 0,
                    flags: data.status === 'FAIL' ? ['Liveness Check Failed'] : [],
                    details: data
                };
            } else {
                return {
                    isFraud: data.status === 'FAKE' || data.score < 50,
                    score: data.score,
                    flags: data.flags || [],
                    details: data
                };
            }

        } catch (error: any) {
            throw new Error(`VeriSnap Scan Failed: ${error.message}`);
        }
    }

    /**
     * Static helper for quick scans
     */
    static async scan(options: ScanOptions & VeriSnapConfig): Promise<ScanResult> {
        const client = new VeriSnap({ apiKey: options.apiKey, baseUrl: options.baseUrl });
        return client.scan(options);
    }
}
