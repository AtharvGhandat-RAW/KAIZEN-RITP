import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    User,
    Calendar,
    Building,
    LogOut,
    RefreshCw,
    History,
    ShieldAlert,
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

type CameraPermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';

export default function CoordinatorScanner() {
    const navigate = useNavigate();
    const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
    const [processing, setProcessing] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [todayCount, setTodayCount] = useState(0);
    const [cameraPermission, setCameraPermission] = useState<CameraPermissionState>('unknown');
    const [cameraError, setCameraError] = useState<string>(''); useEffect(() => {
        // Check if coordinator is logged in
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

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const fetchAssignedEvents = async (eventIds: string[]) => {
        if (!eventIds || eventIds.length === 0) {
            console.log('No event IDs assigned to coordinator');
            setEvents([]);
            toast.warning('No events assigned. Please contact admin.');
            return;
        }

        try {
            console.log('Fetching events for IDs:', eventIds);
            const { data, error } = await supabase
                .from('events')
                .select('id, name')
                .in('id', eventIds);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Fetched events:', data);
            setEvents((data || []) as Array<{ id: string; name: string }>);

            // Auto-select if only one event
            if (data && data.length === 1) {
                setSelectedEvent(data[0].id);
            }

            if (!data || data.length === 0) {
                toast.warning('No events found for assigned IDs');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events. Please refresh.');
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

            if (error) throw error;
            setTodayCount(count || 0);
        } catch (error) {
            console.error('Error fetching today count:', error);
        }
    };

    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = () => {
        return window.isSecureContext || 
               window.location.protocol === 'https:' || 
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
    };

    // Check camera availability with fallbacks for different browsers
    // Extended Navigator type for legacy browser support
    type LegacyNavigator = Navigator & {
        webkitGetUserMedia?: (
            constraints: MediaStreamConstraints,
            success: (stream: MediaStream) => void,
            error: (err: Error) => void
        ) => void;
        mozGetUserMedia?: (
            constraints: MediaStreamConstraints,
            success: (stream: MediaStream) => void,
            error: (err: Error) => void
        ) => void;
        msGetUserMedia?: (
            constraints: MediaStreamConstraints,
            success: (stream: MediaStream) => void,
            error: (err: Error) => void
        ) => void;
    };

    const checkCameraAvailability = async (): Promise<boolean> => {
        // Check secure context first
        if (!isSecureContext()) {
            setCameraError('Camera requires HTTPS. Please use https:// URL.');
            return false;
        }

        const nav = navigator as LegacyNavigator;

        // Check for mediaDevices API with various fallbacks
        const mediaDevices = navigator.mediaDevices || 
            (nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia ? {
                getUserMedia: (constraints: MediaStreamConstraints) => {
                    return new Promise<MediaStream>((resolve, reject) => {
                        const getUserMedia = nav.webkitGetUserMedia || 
                                           nav.mozGetUserMedia || 
                                           nav.msGetUserMedia;
                        if (!getUserMedia) {
                            reject(new Error('getUserMedia not supported'));
                            return;
                        }
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                }
            } : null);

        if (!mediaDevices || !mediaDevices.getUserMedia) {
            // Last resort - check if we can enumerate devices
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const hasCamera = devices.some(device => device.kind === 'videoinput');
                    if (!hasCamera) {
                        setCameraError('No camera detected on this device.');
                        return false;
                    }
                } catch (e) {
                    console.log('Could not enumerate devices');
                }
            }
            
            setCameraError('Camera API not available. Try using Chrome, Safari, or Firefox browser.');
            return false;
        }

        return true;
    };

    const startScanning = async () => {
        if (!selectedEvent) {
            toast.error('Please select an event first');
            return;
        }

        setCameraError('');
        
        // First check if camera is available
        const cameraAvailable = await checkCameraAvailability();
        if (!cameraAvailable) {
            toast.error('Camera not available');
            return;
        }

        try {
            // Check current permission state if available
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    setCameraPermission(permissionStatus.state as CameraPermissionState);
                    console.log('Camera permission state:', permissionStatus.state);
                } catch (e) {
                    console.log('Permission query not supported, will request directly');
                }
            }

            // Request camera access - try different constraint configurations
            console.log('Requesting camera access...');
            let stream: MediaStream | null = null;
            
            // Try with environment camera first (back camera on mobile)
            const constraintOptions = [
                { video: { facingMode: { exact: 'environment' } } },
                { video: { facingMode: 'environment' } },
                { video: { facingMode: { ideal: 'environment' } } },
                { video: true }
            ];

            for (const constraints of constraintOptions) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                    console.log('Camera access granted with constraints:', constraints);
                    break;
                } catch (e) {
                    console.log('Failed with constraints:', constraints, e);
                }
            }

            if (!stream) {
                throw new Error('Could not access camera with any configuration');
            }

            // Permission granted - stop the test stream
            stream.getTracks().forEach(track => track.stop());
            setCameraPermission('granted');

            // Now start the QR scanner
            const html5QrCode = new Html5Qrcode('qr-reader', {
                verbose: false,
                formatsToSupport: [0] // QR_CODE format
            });
            scannerRef.current = html5QrCode;

            // Scanner configuration - optimize for mobile
            const scannerConfig = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                disableFlip: false,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            };

            // Try starting scanner with different configs
            try {
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    scannerConfig,
                    onScanSuccess,
                    onScanFailure
                );
            } catch (scannerError) {
                console.log('Trying simpler scanner config...', scannerError);
                // Try with simpler config - no qrbox constraint
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: 200 },
                    onScanSuccess,
                    onScanFailure
                );
            }

            setIsScanning(true);
            setScanResult(null);
            toast.success('Scanner started!');
        } catch (error: unknown) {
            console.error('Camera/Scanner error:', error);
            const err = error as DOMException;
            const errorMessage = err.message || String(error);

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || errorMessage.includes('denied')) {
                setCameraPermission('denied');
                setCameraError('Camera permission denied. Please allow camera access in your browser settings, then refresh the page.');
                toast.error('Camera access denied');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || errorMessage.includes('not found')) {
                setCameraError('No camera found on this device.');
                toast.error('No camera found');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError' || errorMessage.includes('in use')) {
                setCameraError('Camera is in use by another app. Please close other apps using the camera and try again.');
                toast.error('Camera is busy');
            } else if (err.name === 'SecurityError' || errorMessage.includes('secure') || errorMessage.includes('https')) {
                setCameraError('Camera access blocked. Make sure you are using HTTPS.');
                toast.error('HTTPS required for camera');
            } else {
                setCameraError(`Camera error: ${errorMessage}. Please try refreshing the page or use a different browser.`);
                toast.error('Failed to start camera');
            }
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
    };

    const onScanSuccess = async (decodedText: string) => {
        if (processing) return;
        setProcessing(true);

        try {
            // Stop scanner temporarily
            await stopScanning();

            // Decrypt and validate QR data
            const payload = decryptQRData(decodedText);

            if (!payload || !isValidQRPayload(payload)) {
                setScanResult({
                    success: false,
                    message: 'Invalid QR code. This may not be a valid event pass.',
                });
                setProcessing(false);
                return;
            }

            // Check if event matches
            if (payload.eventId !== selectedEvent) {
                const eventName = events.find(e => e.id === payload.eventId)?.name || 'another event';
                setScanResult({
                    success: false,
                    message: `This pass is for ${eventName}, not the selected event.`,
                    data: payload,
                });
                setProcessing(false);
                return;
            }

            // Check if already marked attendance
            const { data: existingAttendance } = await supabase
                .from('attendance')
                .select('id, marked_at')
                .eq('registration_id', payload.registrationId)
                .eq('event_id', payload.eventId)
                .single();

            if (existingAttendance) {
                setScanResult({
                    success: false,
                    message: 'Attendance already marked for this registration.',
                    data: payload,
                    attendeeName: payload.name,
                    alreadyMarked: true,
                });
                setProcessing(false);
                return;
            }

            // Verify registration exists and is completed
            const { data: registration, error: regError } = await supabase
                .from('registrations')
                .select('id, payment_status, profiles(full_name)')
                .eq('id', payload.registrationId)
                .single();

            if (regError || !registration) {
                setScanResult({
                    success: false,
                    message: 'Registration not found in system.',
                    data: payload,
                });
                setProcessing(false);
                return;
            }

            if (registration.payment_status !== 'completed' && registration.payment_status !== 'verified') {
                const profiles = registration.profiles as { full_name?: string } | null;
                setScanResult({
                    success: false,
                    message: `Registration payment status is "${registration.payment_status}". Only completed registrations can be verified.`,
                    data: payload,
                    attendeeName: profiles?.full_name || payload.name,
                });
                setProcessing(false);
                return;
            }

            // Mark attendance
            const { error: attendanceError } = await supabase
                .from('attendance')
                .insert({
                    registration_id: payload.registrationId,
                    event_id: payload.eventId,
                    marked_by: coordinator?.id,
                    verification_method: 'qr_scan',
                });

            if (attendanceError) {
                throw attendanceError;
            }

            // Success!
            setScanResult({
                success: true,
                message: 'Attendance marked successfully!',
                data: payload,
                attendeeName: payload.name,
            });

            // Add to recent scans
            setRecentScans(prev => [
                {
                    timestamp: new Date(),
                    name: payload.name,
                    event: events.find(e => e.id === payload.eventId)?.name || 'Unknown',
                    success: true,
                },
                ...prev.slice(0, 9),
            ]);

            setTodayCount(prev => prev + 1);
            toast.success(`✓ ${payload.name} checked in!`);
        } catch (error) {
            console.error('Scan processing error:', error);
            setScanResult({
                success: false,
                message: 'An error occurred while processing. Please try again.',
            });
        } finally {
            setProcessing(false);
        }
    };

    const onScanFailure = (error: string) => {
        // This is called for every failed scan attempt, which is normal
        // Only log actual errors, not "QR code not found" type messages
        if (!error.includes('No QR code found') && !error.includes('NotFoundException')) {
            console.error('Scan error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('coordinator');
        navigate('/coordinator/login');
    };

    const resetScanner = () => {
        setScanResult(null);
        if (!isScanning) {
            startScanning();
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

            <main className="container mx-auto px-4 py-6 max-w-lg">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="bg-black/40 border-green-600/30">
                        <CardContent className="pt-4 text-center">
                            <p className="text-3xl font-bold text-green-400">{todayCount}</p>
                            <p className="text-xs text-gray-400">Scanned Today</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-black/40 border-blue-600/30">
                        <CardContent className="pt-4 text-center">
                            <p className="text-3xl font-bold text-blue-400">{events.length}</p>
                            <p className="text-xs text-gray-400">Assigned Events</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Event Selection */}
                <Card className="bg-black/40 border-red-600/30 mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-gray-400">Select Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {events.length === 0 ? (
                            <div className="text-center py-4">
                                <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                <p className="text-yellow-400 text-sm">No events assigned</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    Contact admin to assign events to your account
                                </p>
                            </div>
                        ) : (
                            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                                <SelectTrigger className="bg-black/40 border-red-600/30">
                                    <SelectValue placeholder="Choose an event to scan for" />
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
                <Card className="bg-black/40 border-red-600/30 mb-6 overflow-hidden">
                    <CardContent className="p-0">
                        {/* QR Scanner */}
                        <div className={`relative ${!isScanning ? 'hidden' : ''}`}>
                            <div
                                id="qr-reader"
                                className="w-full"
                                style={{
                                    minHeight: '350px',
                                }}
                            ></div>
                            
                            {/* Scanning overlay with frame */}
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Corner brackets */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px]">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500"></div>
                                </div>
                                
                                {/* Scanning line animation */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] overflow-hidden">
                                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
                                </div>
                            </div>
                            
                            {/* Stop button */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                <Button
                                    onClick={stopScanning}
                                    className="bg-red-600/90 hover:bg-red-700 shadow-lg"
                                >
                                    <CameraOff className="w-4 h-4 mr-2" />
                                    Stop Scanning
                                </Button>
                            </div>
                            
                            {/* Processing indicator */}
                            {processing && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto mb-2"></div>
                                        <p className="text-white text-sm">Processing...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Custom styles for html5-qrcode */}
                        {isScanning && (
                            <style>{`
                                #qr-reader {
                                    border: none !important;
                                    width: 100% !important;
                                }
                                #qr-reader video {
                                    width: 100% !important;
                                    height: auto !important;
                                    min-height: 350px !important;
                                    object-fit: cover !important;
                                    border-radius: 0 !important;
                                }
                                #qr-reader__scan_region {
                                    background: transparent !important;
                                    min-height: 300px !important;
                                }
                                #qr-reader__scan_region video {
                                    display: block !important;
                                    width: 100% !important;
                                }
                                #qr-reader__dashboard {
                                    display: none !important;
                                }
                                #qr-reader__dashboard_section {
                                    display: none !important;
                                }
                                #qr-reader__dashboard_section_csr {
                                    display: none !important;
                                }
                                #qr-reader__header_message {
                                    display: none !important;
                                }
                                #qr-reader img {
                                    display: none !important;
                                }
                                #qr-reader__camera_selection {
                                    display: none !important;
                                }
                                #qr-shaded-region {
                                    border-color: rgba(239, 68, 68, 0.5) !important;
                                }
                            `}</style>
                        )}

                        {/* Camera Permission Denied */}
                        {!isScanning && !scanResult && cameraPermission === 'denied' && (
                            <div className="aspect-square flex flex-col items-center justify-center bg-red-900/20 p-6">
                                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                                <h3 className="text-red-400 font-semibold text-lg mb-2">Camera Access Denied</h3>
                                <p className="text-gray-400 text-center text-sm mb-4">
                                    Please allow camera permission to scan QR codes
                                </p>
                                <div className="bg-black/40 rounded-lg p-4 mb-4 text-left w-full max-w-xs">
                                    <p className="text-gray-300 text-xs mb-2 font-semibold">How to enable:</p>
                                    <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                                        <li>Tap the lock/info icon in address bar</li>
                                        <li>Find "Camera" permission</li>
                                        <li>Set to "Allow"</li>
                                        <li>Refresh this page</li>
                                    </ol>
                                </div>
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Refresh Page
                                </Button>
                            </div>
                        )}

                        {/* Camera Error */}
                        {!isScanning && !scanResult && cameraError && cameraPermission !== 'denied' && (
                            <div className="aspect-square flex flex-col items-center justify-center bg-yellow-900/20 p-6 overflow-y-auto">
                                <AlertCircle className="w-12 h-12 text-yellow-500 mb-3 flex-shrink-0" />
                                <h3 className="text-yellow-400 font-semibold text-lg mb-2">Camera Error</h3>
                                <p className="text-gray-400 text-center text-sm mb-3 px-2">
                                    {cameraError}
                                </p>
                                
                                {/* HTTPS Required Message */}
                                {!window.isSecureContext && (
                                    <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-3 w-full max-w-xs">
                                        <p className="text-red-400 text-xs font-semibold mb-1">⚠️ HTTPS Required</p>
                                        <p className="text-gray-300 text-xs mb-2">
                                            Camera only works on secure (HTTPS) connections.
                                        </p>
                                        <p className="text-green-400 text-xs font-mono break-all">
                                            Use: https://kaizen-ritp.in/coordinator/scan
                                        </p>
                                    </div>
                                )}
                                
                                {/* Debug info */}
                                <div className="bg-black/40 rounded-lg p-2 mb-3 text-left w-full max-w-xs">
                                    <p className="text-gray-500 text-xs truncate">
                                        URL: {window.location.href}
                                    </p>
                                    <p className={`text-xs ${window.isSecureContext ? 'text-green-500' : 'text-red-500'}`}>
                                        Secure: {window.isSecureContext ? '✓ Yes' : '✗ No'}
                                    </p>
                                </div>
                                
                                <div className="flex gap-2 flex-wrap justify-center">
                                    <Button
                                        onClick={() => {
                                            setCameraError('');
                                            startScanning();
                                        }}
                                        className="bg-yellow-600 hover:bg-yellow-700"
                                    >
                                        <Camera className="w-4 h-4 mr-2" />
                                        Try Again
                                    </Button>
                                    <Button
                                        onClick={() => window.location.reload()}
                                        variant="outline"
                                        className="border-yellow-600/30"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Placeholder when not scanning */}
                        {!isScanning && !scanResult && !cameraError && cameraPermission !== 'denied' && (
                            <div className="aspect-square flex flex-col items-center justify-center bg-gray-900/50 p-6">
                                <Camera className="w-16 h-16 text-gray-600 mb-4" />
                                <p className="text-gray-400 text-center mb-2">
                                    Camera preview will appear here
                                </p>
                                <p className="text-gray-500 text-xs text-center mb-4">
                                    You may be asked to allow camera access
                                </p>
                                <Button
                                    onClick={startScanning}
                                    disabled={!selectedEvent || events.length === 0}
                                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                >
                                    <Camera className="w-4 h-4 mr-2" />
                                    {!selectedEvent ? 'Select Event First' : 'Start Scanning'}
                                </Button>
                            </div>
                        )}

                        {/* Scan Result */}
                        {scanResult && (
                            <div
                                className={`p-6 ${scanResult.success
                                    ? 'bg-green-900/30'
                                    : scanResult.alreadyMarked
                                        ? 'bg-yellow-900/30'
                                        : 'bg-red-900/30'
                                    }`}
                            >
                                <div className="text-center">
                                    {scanResult.success ? (
                                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    ) : scanResult.alreadyMarked ? (
                                        <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                                    ) : (
                                        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    )}

                                    <h3
                                        className={`text-xl font-bold mb-2 ${scanResult.success
                                            ? 'text-green-400'
                                            : scanResult.alreadyMarked
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                            }`}
                                    >
                                        {scanResult.success
                                            ? 'Check-in Successful!'
                                            : scanResult.alreadyMarked
                                                ? 'Already Checked In'
                                                : 'Scan Failed'}
                                    </h3>

                                    <p className="text-gray-300 mb-4">{scanResult.message}</p>

                                    {scanResult.attendeeName && (
                                        <div className="bg-black/30 rounded-lg p-4 mb-4 text-left">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-white font-medium">
                                                    {scanResult.attendeeName}
                                                </span>
                                            </div>
                                            {scanResult.data?.email && (
                                                <p className="text-gray-400 text-sm ml-6">
                                                    {scanResult.data.email}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        onClick={resetScanner}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Scan Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Control Buttons */}
                {isScanning && (
                    <div className="flex gap-4 mb-6">
                        <Button
                            onClick={stopScanning}
                            variant="outline"
                            className="flex-1 border-red-600/30"
                        >
                            <CameraOff className="w-4 h-4 mr-2" />
                            Stop
                        </Button>
                    </div>
                )}

                {/* Recent Scans */}
                {recentScans.length > 0 && (
                    <Card className="bg-black/40 border-red-600/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Recent Scans
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {recentScans.map((scan, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            {scan.success ? (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-400" />
                                            )}
                                            <div>
                                                <p className="text-white text-sm">{scan.name}</p>
                                                <p className="text-gray-500 text-xs">{scan.event}</p>
                                            </div>
                                        </div>
                                        <span className="text-gray-500 text-xs">
                                            {scan.timestamp.toLocaleTimeString()}
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
