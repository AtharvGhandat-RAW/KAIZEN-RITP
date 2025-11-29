import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    QrCode,
    Camera,
    CameraOff,
    CheckCircle,
    XCircle,
    AlertCircle,
    LogOut,
    RefreshCw,
    History,
} from 'lucide-react';
import { decryptQRData, QRPayload, isValidQRPayload } from '@/utils/qrEncryption';

interface Coordinator {
    id: string;
    name: string;
    email: string;
    assigned_events: string[];
}

interface Event {
    id: string;
    name: string;
}

interface ScanResult {
    success: boolean;
    message: string;
    data?: QRPayload;
    attendeeName?: string;
    alreadyMarked?: boolean;
}

interface RecentScan {
    timestamp: Date;
    name: string;
    event: string;
    success: boolean;
}

export default function CoordinatorScanner() {
    const navigate = useNavigate();
    const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
    const [processing, setProcessing] = useState(false);
    const [todayCount, setTodayCount] = useState(0);
    const [cameraError, setCameraError] = useState<string>('');
    const [isInitializing, setIsInitializing] = useState(false);
    
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = 'qr-reader-container';

    useEffect(() => {
        const coordinatorData = localStorage.getItem('coordinator');
        if (!coordinatorData) {
            navigate('/coordinator/login');
            return;
        }

        try {
            const parsed = JSON.parse(coordinatorData);
            setCoordinator(parsed);
            fetchAssignedEvents(parsed.assigned_events);
            fetchTodayCount(parsed.id);
        } catch {
            navigate('/coordinator/login');
        }
    }, [navigate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try {
                    const state = scannerRef.current.getState();
                    if (state === Html5QrcodeScannerState.SCANNING) {
                        scannerRef.current.stop();
                    }
                } catch (e) {
                    console.log('Cleanup error:', e);
                }
            }
        };
    }, []);

    const fetchAssignedEvents = async (eventIds: string[]) => {
        if (!eventIds || eventIds.length === 0) {
            setEvents([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('events')
                .select('id, name')
                .in('id', eventIds);

            if (error) throw error;
            setEvents(data || []);
            
            if (data && data.length === 1) {
                setSelectedEvent(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
        }
    };

    const fetchTodayCount = async (coordinatorId: string) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count, error } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('marked_by', coordinatorId)
                .gte('marked_at', today.toISOString());

            if (!error && count !== null) {
                setTodayCount(count);
            }
        } catch (error) {
            console.error('Error fetching today count:', error);
        }
    };

    const startScanning = async () => {
        if (!selectedEvent) {
            toast.error('Please select an event first');
            return;
        }

        setCameraError('');
        setIsInitializing(true);
        setScanResult(null);

        // Check for HTTPS
        if (!window.isSecureContext) {
            setCameraError('Camera requires HTTPS. Please use https://kaizen-ritp.in');
            setIsInitializing(false);
            return;
        }

        try {
            // Clean up any existing scanner
            if (scannerRef.current) {
                try {
                    const state = scannerRef.current.getState();
                    if (state === Html5QrcodeScannerState.SCANNING) {
                        await scannerRef.current.stop();
                    }
                    scannerRef.current.clear();
                } catch (e) {
                    console.log('Cleanup error (ignored):', e);
                }
                scannerRef.current = null;
            }

            // Create new scanner instance
            const html5QrCode = new Html5Qrcode(scannerContainerId);
            scannerRef.current = html5QrCode;

            // Get available cameras
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                throw new Error('No cameras found on this device');
            }

            console.log('Available cameras:', cameras);

            // Prefer back camera
            let cameraId = cameras[0].id;
            const backCamera = cameras.find(
                (c) =>
                    c.label.toLowerCase().includes('back') ||
                    c.label.toLowerCase().includes('rear') ||
                    c.label.toLowerCase().includes('environment')
            );
            if (backCamera) {
                cameraId = backCamera.id;
            }

            // Start scanner with camera ID
            await html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                handleScanSuccess,
                handleScanError
            );

            setIsScanning(true);
            setIsInitializing(false);
            toast.success('Scanner ready!');
        } catch (error) {
            console.error('Scanner error:', error);
            setIsInitializing(false);

            const errMsg = error instanceof Error ? error.message : String(error);

            if (errMsg.includes('Permission') || errMsg.includes('denied') || errMsg.includes('NotAllowed')) {
                setCameraError('Camera permission denied. Please allow camera access and refresh.');
            } else if (errMsg.includes('NotFound') || errMsg.includes('No cameras')) {
                setCameraError('No camera found on this device.');
            } else if (errMsg.includes('NotReadable') || errMsg.includes('in use')) {
                setCameraError('Camera is in use by another app. Close other apps and try again.');
            } else {
                setCameraError(`Camera error: ${errMsg}`);
            }
        }
    };

    const stopScanning = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === Html5QrcodeScannerState.SCANNING) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                console.log('Stop error (ignored):', e);
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    }, []);

    const handleScanSuccess = async (decodedText: string) => {
        if (processing) return;
        setProcessing(true);

        // Pause scanner during processing
        if (scannerRef.current) {
            try {
                await scannerRef.current.pause(true);
            } catch (e) {
                console.log('Pause error:', e);
            }
        }

        try {
            // Decrypt QR data
            const payload = decryptQRData(decodedText);

            if (!payload || !isValidQRPayload(payload)) {
                setScanResult({
                    success: false,
                    message: 'Invalid QR code. Not a KAIZEN pass.',
                });
                resumeScanner();
                return;
            }

            // Validate event
            if (payload.eventId !== selectedEvent) {
                const eventName = events.find((e) => e.id === payload.eventId)?.name || 'another event';
                setScanResult({
                    success: false,
                    message: `This pass is for ${eventName}, not the selected event.`,
                    data: payload,
                    attendeeName: payload.name,
                });
                resumeScanner();
                return;
            }

            // Check if already marked
            const { data: existing } = await supabase
                .from('attendance')
                .select('id')
                .eq('registration_id', payload.registrationId)
                .eq('event_id', payload.eventId)
                .maybeSingle();

            if (existing) {
                setScanResult({
                    success: false,
                    message: 'Already checked in!',
                    data: payload,
                    attendeeName: payload.name,
                    alreadyMarked: true,
                });
                resumeScanner();
                return;
            }

            // Mark attendance
            const { error: insertError } = await supabase.from('attendance').insert({
                registration_id: payload.registrationId,
                event_id: payload.eventId,
                marked_by: coordinator?.id,
                marked_at: new Date().toISOString(),
            });

            if (insertError) throw insertError;

            // Success!
            setScanResult({
                success: true,
                message: 'Attendance marked successfully!',
                data: payload,
                attendeeName: payload.name,
            });

            setRecentScans((prev) => [
                {
                    timestamp: new Date(),
                    name: payload.name,
                    event: events.find((e) => e.id === payload.eventId)?.name || 'Unknown',
                    success: true,
                },
                ...prev.slice(0, 9),
            ]);

            setTodayCount((prev) => prev + 1);
            toast.success(`✓ ${payload.name} checked in!`);
        } catch (error) {
            console.error('Scan processing error:', error);
            setScanResult({
                success: false,
                message: 'An error occurred. Please try again.',
            });
        } finally {
            setProcessing(false);
        }
    };

    const resumeScanner = () => {
        setTimeout(() => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.resume();
                } catch (e) {
                    console.log('Resume error:', e);
                }
            }
            setProcessing(false);
        }, 1500);
    };

    const handleScanError = (error: string) => {
        // Ignore normal "no QR found" messages
        if (!error.includes('No QR') && !error.includes('NotFoundException')) {
            console.log('Scan error:', error);
        }
    };

    const handleLogout = () => {
        stopScanning();
        localStorage.removeItem('coordinator');
        navigate('/coordinator/login');
    };

    const resetScanner = async () => {
        setScanResult(null);
        if (scannerRef.current) {
            try {
                scannerRef.current.resume();
            } catch {
                // If resume fails, restart scanner
                await stopScanning();
                await startScanning();
            }
        } else {
            await startScanning();
        }
    };

    if (!coordinator) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Optimized CSS for battery saving */}
            <style>{`
                * {
                    -webkit-tap-highlight-color: transparent;
                }
                #${scannerContainerId} {
                    width: 100% !important;
                    border: none !important;
                }
                #${scannerContainerId} video {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 300px !important;
                    object-fit: cover !important;
                    border-radius: 8px !important;
                }
                #${scannerContainerId}__scan_region {
                    background: transparent !important;
                }
                #${scannerContainerId}__dashboard,
                #${scannerContainerId}__dashboard_section,
                #${scannerContainerId}__dashboard_section_csr,
                #${scannerContainerId}__header_message,
                #${scannerContainerId}__camera_selection {
                    display: none !important;
                }
                #${scannerContainerId} img[alt="Info icon"] {
                    display: none !important;
                }
                #qr-shaded-region {
                    border-color: rgba(239, 68, 68, 0.7) !important;
                }
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-gray-900/95 border-b border-red-600/30 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <QrCode className="w-6 h-6 text-red-500" />
                        <div>
                            <h1 className="text-lg font-bold text-red-500">KAIZEN Scanner</h1>
                            <p className="text-xs text-gray-400">{coordinator.name}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-red-400"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-4 max-w-lg">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Card className="bg-black/40 border-green-600/30">
                        <CardContent className="py-3 text-center">
                            <p className="text-2xl font-bold text-green-400">{todayCount}</p>
                            <p className="text-xs text-gray-400">Scanned Today</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-black/40 border-blue-600/30">
                        <CardContent className="py-3 text-center">
                            <p className="text-2xl font-bold text-blue-400">{events.length}</p>
                            <p className="text-xs text-gray-400">Assigned Events</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Event Selection */}
                <Card className="bg-black/40 border-red-600/30 mb-4">
                    <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm text-gray-400">Select Event</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                        {events.length === 0 ? (
                            <div className="text-center py-3">
                                <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                                <p className="text-yellow-400 text-sm">No events assigned</p>
                            </div>
                        ) : (
                            <Select 
                                value={selectedEvent} 
                                onValueChange={setSelectedEvent}
                                disabled={isScanning}
                            >
                                <SelectTrigger className="bg-black/40 border-red-600/30">
                                    <SelectValue placeholder="Choose an event" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-red-600/30">
                                    {events.map((event) => (
                                        <SelectItem key={event.id} value={event.id}>
                                            {event.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </CardContent>
                </Card>

                {/* Scanner Area */}
                <Card className="bg-black/40 border-red-600/30 mb-4 overflow-hidden relative">
                    <CardContent className="p-0">
                        {/* Scanner Container - Always present */}
                        <div 
                            id={scannerContainerId} 
                            className={`w-full ${!isScanning ? 'hidden' : ''}`}
                            style={{ minHeight: isScanning ? '320px' : '0' }}
                        />

                        {/* Scanning Overlay */}
                        {isScanning && !scanResult && (
                            <div className="p-3 bg-black/60 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-400 text-sm">Scanning...</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={stopScanning}
                                >
                                    <CameraOff className="w-4 h-4 mr-1" />
                                    Stop
                                </Button>
                            </div>
                        )}

                        {/* Processing Overlay */}
                        {processing && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                                    <p className="text-white text-sm">Processing...</p>
                                </div>
                            </div>
                        )}

                        {/* Initializing State */}
                        {isInitializing && (
                            <div className="aspect-video flex flex-col items-center justify-center bg-gray-900/50 p-6">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mb-3"></div>
                                <p className="text-gray-400 text-sm">Starting camera...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {!isScanning && !isInitializing && cameraError && (
                            <div className="aspect-video flex flex-col items-center justify-center bg-red-900/20 p-4">
                                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                                <p className="text-red-400 text-center text-sm mb-3">{cameraError}</p>
                                {!window.isSecureContext && (
                                    <div className="bg-black/40 rounded p-2 mb-3 text-center">
                                        <p className="text-green-400 text-xs font-mono">
                                            https://kaizen-ritp.in/coordinator/scan
                                        </p>
                                    </div>
                                )}
                                <Button onClick={() => { setCameraError(''); startScanning(); }} size="sm">
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {/* Idle State */}
                        {!isScanning && !isInitializing && !cameraError && !scanResult && (
                            <div className="aspect-video flex flex-col items-center justify-center bg-gray-900/50 p-6">
                                <Camera className="w-12 h-12 text-gray-600 mb-3" />
                                <p className="text-gray-400 text-center text-sm mb-4">
                                    {!selectedEvent ? 'Select an event first' : 'Ready to scan'}
                                </p>
                                <Button
                                    onClick={startScanning}
                                    disabled={!selectedEvent || events.length === 0}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Start Scanner
                                </Button>
                            </div>
                        )}

                        {/* Scan Result */}
                        {scanResult && (
                            <div
                                className={`p-6 text-center ${
                                    scanResult.success
                                        ? 'bg-green-900/30'
                                        : scanResult.alreadyMarked
                                        ? 'bg-yellow-900/30'
                                        : 'bg-red-900/30'
                                }`}
                            >
                                {scanResult.success ? (
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                                ) : scanResult.alreadyMarked ? (
                                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
                                ) : (
                                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                                )}

                                <h3
                                    className={`text-xl font-bold mb-2 ${
                                        scanResult.success
                                            ? 'text-green-400'
                                            : scanResult.alreadyMarked
                                            ? 'text-yellow-400'
                                            : 'text-red-400'
                                    }`}
                                >
                                    {scanResult.success
                                        ? 'Success!'
                                        : scanResult.alreadyMarked
                                        ? 'Already Checked In'
                                        : 'Error'}
                                </h3>

                                {scanResult.attendeeName && (
                                    <p className="text-white text-lg mb-2">{scanResult.attendeeName}</p>
                                )}

                                <p className="text-gray-300 text-sm mb-4">{scanResult.message}</p>

                                <Button onClick={resetScanner} className="bg-red-600 hover:bg-red-700">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Scan Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Scans */}
                {recentScans.length > 0 && (
                    <Card className="bg-black/40 border-gray-700/30">
                        <CardHeader className="pb-2 pt-3">
                            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Recent Scans
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {recentScans.map((scan, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between text-sm py-1 border-b border-gray-800 last:border-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            {scan.success ? (
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                            ) : (
                                                <XCircle className="w-3 h-3 text-red-500" />
                                            )}
                                            <span className="text-gray-300 truncate max-w-[150px]">
                                                {scan.name}
                                            </span>
                                        </div>
                                        <span className="text-gray-500 text-xs">
                                            {scan.timestamp.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
