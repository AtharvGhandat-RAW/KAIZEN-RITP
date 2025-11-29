import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, CheckCircle } from 'lucide-react';
import { encryptQRData, createQRPayload, generateVerificationCode, QRPayload } from '@/utils/qrEncryption';

interface QRPassGeneratorProps {
    registration: {
        id: string;
        event_id: string;
        name: string;
        email: string;
        phone?: string;
        college?: string;
        education_type?: string;
    };
    eventName: string;
    eventDate?: string;
    eventVenue?: string;
}

export const QRPassGenerator: React.FC<QRPassGeneratorProps> = ({
    registration,
    eventName,
    eventDate,
    eventVenue,
}) => {
    const passRef = useRef<HTMLDivElement>(null);

    // Create encrypted QR data
    const qrPayload = createQRPayload(registration, eventName);
    const encryptedData = encryptQRData(qrPayload);
    const verificationCode = generateVerificationCode(registration.id);

    // Download pass as image
    const downloadPass = async () => {
        if (!passRef.current) return;

        try {
            const canvas = await html2canvas(passRef.current, {
                backgroundColor: '#1a1a1a',
                scale: 2,
            });

            const link = document.createElement('a');
            link.download = `kaizen-pass-${registration.name.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error downloading pass:', error);
        }
    };

    // Share pass (if supported)
    const sharePass = async () => {
        if (!navigator.share) {
            alert('Sharing is not supported on this device');
            return;
        }

        if (!passRef.current) return;

        try {
            const canvas = await html2canvas(passRef.current, {
                backgroundColor: '#1a1a1a',
                scale: 2,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const file = new File([blob], `kaizen-pass.png`, { type: 'image/png' });

                await navigator.share({
                    title: `KAIZEN Event Pass - ${eventName}`,
                    text: `Event pass for ${registration.name}`,
                    files: [file],
                });
            });
        } catch (error) {
            console.error('Error sharing pass:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Event Pass Card */}
            <div
                ref={passRef}
                className="bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl shadow-red-500/20 max-w-sm mx-auto"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-800 px-4 py-3 text-center">
                    <h2 className="text-xl font-bold text-white tracking-wider">KAIZEN 2026</h2>
                    <p className="text-red-100 text-sm">EVENT PASS</p>
                </div>

                {/* Main Content */}
                <div className="p-4 space-y-4">
                    {/* QR Code - clean without overlay for reliable scanning */}
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-xl shadow-lg">
                            <QRCodeSVG
                                value={encryptedData}
                                size={200}
                                level="M"
                                includeMargin={true}
                            />
                        </div>
                    </div>

                    {/* KAIZEN 2026 branding below QR */}
                    <div className="text-center">
                        <span className="text-red-500 font-bold text-sm tracking-wider">KAIZEN 2026</span>
                    </div>

                    {/* Verification Code */}
                    <div className="text-center">
                        <p className="text-gray-400 text-xs">VERIFICATION CODE</p>
                        <p className="text-red-400 font-mono text-lg tracking-widest">{verificationCode}</p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashed border-gray-600 relative">
                        <div className="absolute -left-4 -top-3 w-6 h-6 bg-gray-950 rounded-full"></div>
                        <div className="absolute -right-4 -top-3 w-6 h-6 bg-gray-950 rounded-full"></div>
                    </div>

                    {/* Attendee Details */}
                    <div className="space-y-2">
                        <div>
                            <p className="text-gray-400 text-xs uppercase">Attendee Name</p>
                            <p className="text-white font-semibold text-lg">{registration.name}</p>
                        </div>

                        {registration.college && (
                            <div>
                                <p className="text-gray-400 text-xs uppercase">College</p>
                                <p className="text-gray-200 text-sm">{registration.college}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-gray-400 text-xs uppercase">Event</p>
                            <p className="text-red-400 font-semibold">{eventName}</p>
                        </div>

                        {eventDate && (
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase">Date</p>
                                    <p className="text-gray-200 text-sm">{eventDate}</p>
                                </div>
                                {eventVenue && (
                                    <div className="text-right">
                                        <p className="text-gray-400 text-xs uppercase">Venue</p>
                                        <p className="text-gray-200 text-sm">{eventVenue}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center gap-2 bg-green-900/30 border border-green-500/30 rounded-lg py-2 px-4">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Registration Confirmed</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-800/50 px-4 py-2 text-center">
                    <p className="text-gray-400 text-xs">
                        Present this pass at the event entrance
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
                <Button
                    onClick={downloadPass}
                    className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Pass
                </Button>

                {'share' in navigator && (
                    <Button
                        onClick={sharePass}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                )}
            </div>
        </div>
    );
};

export default QRPassGenerator;
