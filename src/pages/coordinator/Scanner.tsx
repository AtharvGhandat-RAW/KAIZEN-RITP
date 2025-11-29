import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
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
    Keyboard,
    Search,
} from 'lucide-react';
import { decryptQRData, QRPayload, isValidQRPayload, generateVerificationCode } from '@/utils/qrEncryption';

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
    const [verificationCode, setVerificationCode] = useState('');
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('scan');
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedRef = useRef<string>('');
    const scannerContainerId = 'qr-reader-container';

    // Debug logger function
    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        setDebugLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
    }, []);

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
        lastScannedRef.current = '';
        setDebugLogs([]); // Clear previous logs

        addLog('Starting camera initialization...');
        addLog(`Secure context: ${window.isSecureContext}`);
        addLog(`UserAgent: ${navigator.userAgent.substring(0, 50)}...`);

        // Check for HTTPS
        if (!window.isSecureContext) {
            setCameraError('Camera requires HTTPS. Please use https://kaizen-ritp.in');
            setIsInitializing(false);
            return;
        }

        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            addLog('ERROR: mediaDevices API not available');
            setCameraError('Camera API not supported. Please use Chrome browser.');
            setIsInitializing(false);
            return;
        }
        addLog('mediaDevices API available');

        try {
            // Clean up any existing scanner
            if (scannerRef.current) {
                addLog('Cleaning up existing scanner...');
                try {
                    const state = scannerRef.current.getState();
                    if (state === Html5QrcodeScannerState.SCANNING) {
                        await scannerRef.current.stop();
                    }
                    scannerRef.current.clear();
                } catch (e) {
                    addLog(`Cleanup error (ignored): ${e}`);
                }
                scannerRef.current = null;
            }

            // First check camera permission status (if supported)
            let permissionStatus: PermissionState | null = null;
            try {
                const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
                permissionStatus = result.state;
                addLog(`Permission API status: ${permissionStatus}`);
            } catch (e) {
                addLog('Permission API not supported');
            }

            // Get available cameras first - this helps on Android
            addLog('Enumerating cameras...');
            let cameras: { id: string; label: string }[] = [];
            try {
                cameras = await Html5Qrcode.getCameras();
                addLog(`Found ${cameras.length} cameras`);
                cameras.forEach((c, i) => addLog(`Camera ${i}: ${c.label || c.id}`));
            } catch (e) {
                addLog(`Camera enumeration failed: ${e}`);
            }

            // If no cameras found and permission not granted, we need to request it
            if (cameras.length === 0 && permissionStatus !== 'granted') {
                addLog('No cameras found, requesting via getUserMedia...');
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { ideal: 'environment' } },
                        audio: false
                    });
                    addLog(`Got stream with ${stream.getTracks().length} tracks`);
                    
                    stream.getTracks().forEach(track => {
                        addLog(`Stopping track: ${track.kind} - ${track.label}`);
                        track.stop();
                    });
                    
                    addLog('Waiting for camera release...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    cameras = await Html5Qrcode.getCameras();
                    addLog(`After permission: ${cameras.length} cameras found`);
                    
                } catch (permError: unknown) {
                    const err = permError as Error;
                    addLog(`getUserMedia ERROR: ${err.name} - ${err.message}`);

                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setCameraError('CAMERA_PERMISSION_DENIED');
                        setIsInitializing(false);
                        return;
                    } else if (err.name === 'NotFoundError') {
                        setCameraError('No camera found on this device.');
                        setIsInitializing(false);
                        return;
                    } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
                        setCameraError('CAMERA_IN_USE');
                        setIsInitializing(false);
                        return;
                    }
                    addLog('Continuing despite error...');
                }
            }

            // Create scanner
            addLog('Creating Html5Qrcode scanner...');
            const html5QrCode = new Html5Qrcode(scannerContainerId, { verbose: true });
            scannerRef.current = html5QrCode;

            const cameraConfig = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            // Strategy 1: If we have cameras, try them directly by ID
            if (cameras.length > 0) {
                addLog('Strategy 1: Trying cameras by ID...');
                const backCamera = cameras.find(c => 
                    c.label.toLowerCase().includes('back') || 
                    c.label.toLowerCase().includes('rear') ||
                    c.label.toLowerCase().includes('environment') ||
                    c.id === '0'
                ) || cameras[cameras.length - 1];

                for (const camera of [backCamera, ...cameras.filter(c => c !== backCamera)]) {
                    try {
                        addLog(`Trying camera: ${camera.label || camera.id}`);
                        await html5QrCode.start(
                            camera.id,
                            cameraConfig,
                            handleScanSuccess,
                            handleScanError
                        );
                        addLog('SUCCESS! Scanner started');
                        setIsScanning(true);
                        setIsInitializing(false);
                        toast.success('Scanner ready!');
                        return;
                    } catch (camError) {
                        const e = camError as Error;
                        addLog(`Camera failed: ${e.name} - ${e.message}`);
                        try { html5QrCode.clear(); } catch (clearErr) { console.log('Clear error:', clearErr); }
                        scannerRef.current = new Html5Qrcode(scannerContainerId, { verbose: true });
                    }
                }
            }

            // Strategy 2: Try facingMode constraints
            addLog('Strategy 2: Trying facingMode constraints...');
            const facingModes = ['environment', 'user'];
            for (const facingMode of facingModes) {
                try {
                    addLog(`Trying facingMode: ${facingMode}`);
                    await html5QrCode.start(
                        { facingMode: facingMode },
                        cameraConfig,
                        handleScanSuccess,
                        handleScanError
                    );
                    addLog('SUCCESS! Scanner started');
                    setIsScanning(true);
                    setIsInitializing(false);
                    toast.success(`Scanner ready (${facingMode === 'environment' ? 'back' : 'front'} camera)!`);
                    return;
                } catch (fmError) {
                    const e = fmError as Error;
                    addLog(`FacingMode ${facingMode} failed: ${e.name} - ${e.message}`);
                    try { html5QrCode.clear(); } catch (clearErr) { console.log('Clear error:', clearErr); }
                    scannerRef.current = new Html5Qrcode(scannerContainerId, { verbose: true });
                }
            }

            // Strategy 3: Try exact constraints
            addLog('Strategy 3: Trying exact environment...');
            try {
                await html5QrCode.start(
                    { facingMode: { exact: 'environment' } },
                    cameraConfig,
                    handleScanSuccess,
                    handleScanError
                );
                addLog('SUCCESS! Scanner started');
                setIsScanning(true);
                setIsInitializing(false);
                toast.success('Scanner ready!');
                return;
            } catch (e) {
                const err = e as Error;
                addLog(`Exact environment failed: ${err.name} - ${err.message}`);
            }

            // If we reach here, nothing worked
            addLog('ALL STRATEGIES FAILED');
            throw new Error('Could not start camera. Please check camera permissions.');

        } catch (error) {
            const err = error as Error;
            addLog(`FATAL ERROR: ${err.name} - ${err.message}`);
            setIsInitializing(false);

            const errMsg = err.message || '';
            if (errMsg.includes('Permission') || errMsg.includes('denied') || errMsg.includes('NotAllowed')) {
                setCameraError('CAMERA_PERMISSION_DENIED');
            } else if (errMsg.includes('not found') || errMsg.includes('NotFound')) {
                setCameraError('No camera found.');
            } else {
                setCameraError('CAMERA_IN_USE');
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
        // Prevent duplicate scans of same QR
        if (processing || decodedText === lastScannedRef.current) return;

        lastScannedRef.current = decodedText;
        setProcessing(true);

        // Play success sound/vibration
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // Pause scanner during processing
        if (scannerRef.current) {
            try {
                await scannerRef.current.pause(true);
            } catch (e) {
                console.log('Pause error:', e);
            }
        }

        try {
            console.log('Scanned data length:', decodedText.length);
            console.log('Scanned data preview:', decodedText.substring(0, 50) + '...');

            // Decrypt QR data
            const payload = decryptQRData(decodedText);

            if (!payload || !isValidQRPayload(payload)) {
                console.log('Invalid payload:', payload);
                setScanResult({
                    success: false,
                    message: 'Invalid QR code. Not a valid KAIZEN pass.',
                });
                resumeScanner();
                return;
            }

            console.log('Valid payload:', payload);

            // Validate event
            if (payload.eventId !== selectedEvent) {
                const eventName = events.find((e) => e.id === payload.eventId)?.name || 'another event';
                setScanResult({
                    success: false,
                    message: `This pass is for "${eventName}", not the selected event.`,
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
            lastScannedRef.current = '';
            if (scannerRef.current) {
                try {
                    scannerRef.current.resume();
                } catch (e) {
                    console.log('Resume error:', e);
                }
            }
            setProcessing(false);
        }, 2000);
    };

    const handleScanError = (error: string) => {
        // Only log real errors, not "no QR found" messages
        if (!error.includes('No QR') && !error.includes('NotFoundException') && !error.includes('No MultiFormat')) {
            console.log('Scan error:', error);
        }
    };

    // Manual verification code lookup - optimized
    const verifyByCode = async () => {
        if (!selectedEvent) {
            toast.error('Please select an event first');
            return;
        }

        const code = verificationCode.trim().toUpperCase();
        if (code.length !== 8) {
            toast.error('Verification code must be 8 characters');
            return;
        }

        setVerifyingCode(true);
        setScanResult(null);

        try {
            // OPTIMIZATION: Only fetch registration IDs first (lighter query)
            const { data: regIds, error: regError } = await supabase
                .from('registrations')
                .select('id')
                .eq('event_id', selectedEvent);

            if (regError) throw regError;

            // Find matching registration ID quickly
            let matchedRegId: string | null = null;
            for (const reg of regIds || []) {
                if (generateVerificationCode(reg.id) === code) {
                    matchedRegId = reg.id;
                    break;
                }
            }

            if (!matchedRegId) {
                setScanResult({
                    success: false,
                    message: 'Invalid verification code. No matching registration found.',
                });
                setVerifyingCode(false);
                return;
            }

            // Now fetch only the matched registration with profile
            const { data: registration, error: fetchError } = await supabase
                .from('registrations')
                .select(`
                    id,
                    profiles:profile_id (full_name)
                `)
                .eq('id', matchedRegId)
                .single();

            if (fetchError) throw fetchError;

            const profile = registration?.profiles as { full_name: string } | null;
            const attendeeName = profile?.full_name || 'Unknown';

            // Check if already marked
            const { data: existing } = await supabase
                .from('attendance')
                .select('id')
                .eq('registration_id', matchedRegId)
                .eq('event_id', selectedEvent)
                .maybeSingle();

            if (existing) {
                setScanResult({
                    success: false,
                    message: 'Already checked in!',
                    attendeeName,
                    alreadyMarked: true,
                });
                setVerifyingCode(false);
                return;
            }

            // Mark attendance
            const { error: insertError } = await supabase.from('attendance').insert({
                registration_id: matchedRegId,
                event_id: selectedEvent,
                marked_by: coordinator?.id,
                marked_at: new Date().toISOString(),
            });

            if (insertError) throw insertError;

            // Success!
            setScanResult({
                success: true,
                message: 'Attendance marked successfully!',
                attendeeName,
            });

            setRecentScans((prev) => [
                {
                    timestamp: new Date(),
                    name: attendeeName,
                    event: events.find((e) => e.id === selectedEvent)?.name || 'Unknown',
                    success: true,
                },
                ...prev.slice(0, 9),
            ]);

            setTodayCount((prev) => prev + 1);
            setVerificationCode('');
            toast.success(`✓ ${attendeeName} checked in!`);
        } catch (error) {
            console.error('Verification error:', error);
            setScanResult({
                success: false,
                message: 'An error occurred. Please try again.',
            });
        } finally {
            setVerifyingCode(false);
        }
    };

    const handleLogout = () => {
        stopScanning();
        localStorage.removeItem('coordinator');
        navigate('/coordinator/login');
    };

    const resetScanner = async () => {
        setScanResult(null);
        lastScannedRef.current = '';
        if (activeTab === 'scan') {
            if (scannerRef.current) {
                try {
                    scannerRef.current.resume();
                } catch {
                    await stopScanning();
                    await startScanning();
                }
            } else {
                await startScanning();
            }
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
            {/* Optimized CSS */}
            <style>{`
                * { -webkit-tap-highlight-color: transparent; }
                #${scannerContainerId} {
                    width: 100% !important;
                    border: none !important;
                }
                #${scannerContainerId} video {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 320px !important;
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
                    border-color: rgba(239, 68, 68, 0.8) !important;
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
                                onValueChange={(value) => {
                                    setSelectedEvent(value);
                                    setScanResult(null);
                                }}
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

                {/* Verification Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                        setActiveTab(value);
                        if (value === 'manual' && isScanning) {
                            stopScanning();
                        }
                        setScanResult(null);
                    }}
                    className="mb-4"
                >
                    <TabsList className="grid w-full grid-cols-2 bg-black/40">
                        <TabsTrigger value="scan" className="data-[state=active]:bg-red-600">
                            <Camera className="w-4 h-4 mr-2" />
                            Scan QR
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="data-[state=active]:bg-red-600">
                            <Keyboard className="w-4 h-4 mr-2" />
                            Enter Code
                        </TabsTrigger>
                    </TabsList>

                    {/* QR Scanner Tab */}
                    <TabsContent value="scan" className="mt-4">
                        <Card className="bg-black/40 border-red-600/30 overflow-hidden relative">
                            <CardContent className="p-0">
                                {/* Scanner Container */}
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
                                {!isScanning && !isInitializing && cameraError && !scanResult && (
                                    <div className="flex flex-col items-center justify-center bg-red-900/20 p-4 min-h-[280px]">
                                        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />

                                        {/* Camera Permission Denied - Special handling for Android */}
                                        {cameraError === 'CAMERA_PERMISSION_DENIED' ? (
                                            <>
                                                <p className="text-red-400 text-center text-sm mb-3">
                                                    Camera permission required
                                                </p>
                                                <div className="bg-black/60 rounded-lg p-4 mb-4 text-left w-full max-w-sm">
                                                    {/* Step 1: Android App Permission */}
                                                    <p className="text-red-500 text-sm font-bold mb-3">🔴 STEP 1: Android Permission</p>
                                                    <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside mb-4">
                                                        <li>Go to <span className="text-white font-bold">Phone Settings</span></li>
                                                        <li>Tap <span className="text-white font-bold">"Apps"</span> or <span className="text-white font-bold">"Applications"</span></li>
                                                        <li>Find and tap <span className="text-white font-bold">"Chrome"</span></li>
                                                        <li>Tap <span className="text-white font-bold">"Permissions"</span></li>
                                                        <li>Tap <span className="text-white font-bold">"Camera"</span></li>
                                                        <li>Select <span className="text-green-400 font-bold">"Allow"</span></li>
                                                    </ol>
                                                    
                                                    {/* Step 2: Chrome Site Settings */}
                                                    <div className="pt-3 border-t border-gray-700">
                                                        <p className="text-yellow-400 text-sm font-bold mb-3">🟡 STEP 2: Chrome Site Permission</p>
                                                        <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                                                            <li>Tap <span className="text-white font-bold">⋮</span> menu in Chrome</li>
                                                            <li>Tap <span className="text-white font-bold">"Settings" → "Site settings" → "Camera"</span></li>
                                                            <li>Find <span className="text-blue-400">kaizen-ritp.in</span></li>
                                                            <li>Select <span className="text-green-400 font-bold">"Allow"</span></li>
                                                        </ol>
                                                    </div>
                                                    
                                                    {/* Alternative */}
                                                    <div className="mt-3 pt-3 border-t border-gray-700">
                                                        <p className="text-cyan-400 text-sm font-bold mb-2">💡 Alternative: Clear Site Data</p>
                                                        <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                                                            <li>Tap <span className="text-white font-bold">ⓘ</span> icon left of URL</li>
                                                            <li>Tap <span className="text-white font-bold">"Site settings"</span></li>
                                                            <li>Tap <span className="text-white font-bold">"Clear & reset"</span></li>
                                                            <li>Reload page and allow camera when prompted</li>
                                                        </ol>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 text-xs mb-3 text-center">
                                                    After enabling BOTH permissions, tap "Refresh Page"
                                                </p>
                                            </>
                                        ) : cameraError === 'CAMERA_IN_USE' ? (
                                            <>
                                                <p className="text-red-400 text-center text-sm mb-3">
                                                    Camera is busy or unavailable
                                                </p>
                                                <div className="bg-black/60 rounded-lg p-4 mb-4 text-left w-full max-w-sm">
                                                    <p className="text-yellow-400 text-sm font-semibold mb-3">🔧 Try these steps:</p>
                                                    <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                                                        <li>Close other apps using camera</li>
                                                        <li>Close other browser tabs</li>
                                                        <li>Restart Chrome browser</li>
                                                        <li>If still not working, restart phone</li>
                                                    </ol>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-red-400 text-center text-sm mb-3">{cameraError}</p>
                                        )}

                                        {!window.isSecureContext && (
                                            <div className="bg-black/40 rounded p-2 mb-3 text-center">
                                                <p className="text-green-400 text-xs font-mono">
                                                    https://kaizen-ritp.in/coordinator/scan
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex gap-2 flex-wrap justify-center">
                                            <Button
                                                onClick={() => {
                                                    setCameraError('');
                                                    // Force page reload for permission or in-use errors
                                                    if (cameraError === 'CAMERA_PERMISSION_DENIED' || cameraError === 'CAMERA_IN_USE') {
                                                        window.location.reload();
                                                    } else {
                                                        startScanning();
                                                    }
                                                }}
                                                size="sm"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-1" />
                                                {(cameraError === 'CAMERA_PERMISSION_DENIED' || cameraError === 'CAMERA_IN_USE') ? 'Refresh Page' : 'Try Again'}
                                            </Button>
                                            <Button
                                                onClick={() => setActiveTab('manual')}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Keyboard className="w-4 h-4 mr-1" />
                                                Use Code Instead
                                            </Button>
                                        </div>
                                        
                                        {/* Debug Toggle Button */}
                                        <Button
                                            onClick={() => setShowDebug(!showDebug)}
                                            size="sm"
                                            variant="ghost"
                                            className="mt-3 text-gray-500"
                                        >
                                            {showDebug ? 'Hide' : 'Show'} Debug Logs
                                        </Button>
                                        
                                        {/* Debug Logs Panel */}
                                        {showDebug && debugLogs.length > 0 && (
                                            <div className="mt-3 bg-black/80 rounded-lg p-3 text-left w-full max-w-sm max-h-48 overflow-y-auto">
                                                <p className="text-yellow-400 text-xs font-semibold mb-2">🔧 Debug Logs:</p>
                                                {debugLogs.map((log, i) => (
                                                    <p key={i} className="text-gray-400 text-xs font-mono">{log}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Idle State */}
                                {!isScanning && !isInitializing && !cameraError && !scanResult && (
                                    <div className="aspect-video flex flex-col items-center justify-center bg-gray-900/50 p-6">
                                        <Camera className="w-12 h-12 text-gray-600 mb-3" />
                                        <p className="text-gray-400 text-center text-sm mb-4">
                                            {!selectedEvent ? 'Select an event first' : 'Ready to scan QR codes'}
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
                                        className={`p-6 text-center ${scanResult.success
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
                                            className={`text-xl font-bold mb-2 ${scanResult.success
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
                    </TabsContent>

                    {/* Manual Code Entry Tab */}
                    <TabsContent value="manual" className="mt-4">
                        <Card className="bg-black/40 border-red-600/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-400">Enter Verification Code</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!scanResult ? (
                                    <div className="space-y-4">
                                        <p className="text-gray-400 text-sm">
                                            Enter the 8-character code shown on the attendee's pass
                                        </p>
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                placeholder="e.g., A1B2C3D4"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                                                maxLength={8}
                                                className="bg-black/40 border-red-600/30 text-center text-lg font-mono tracking-widest uppercase"
                                                disabled={verifyingCode || !selectedEvent}
                                            />
                                            <Button
                                                onClick={verifyByCode}
                                                disabled={verifyingCode || verificationCode.length !== 8 || !selectedEvent}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                {verifyingCode ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                ) : (
                                                    <Search className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                        {!selectedEvent && (
                                            <p className="text-yellow-400 text-xs">Please select an event first</p>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className={`p-6 text-center rounded-lg ${scanResult.success
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
                                            className={`text-xl font-bold mb-2 ${scanResult.success
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

                                        <Button onClick={() => setScanResult(null)} className="bg-red-600 hover:bg-red-700">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Verify Another
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Recent Scans */}
                {recentScans.length > 0 && (
                    <Card className="bg-black/40 border-gray-700/30">
                        <CardHeader className="pb-2 pt-3">
                            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Recent Check-ins
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
