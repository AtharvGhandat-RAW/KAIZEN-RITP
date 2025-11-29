import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
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

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanningRef = useRef<boolean>(false);
    const lastScannedRef = useRef<string>('');
    const animationRef = useRef<number | null>(null);

    // Debug logger function
    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        setDebugLogs(prev => [...prev.slice(-30), `[${timestamp}] ${message}`]);
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
            stopCamera();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const stopCamera = useCallback(() => {
        addLog('Stopping camera...');
        scanningRef.current = false;
        
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                addLog(`Stopped track: ${track.label}`);
            });
            streamRef.current = null;
        }
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        setIsScanning(false);
    }, [addLog]);

    const handleScanSuccess = useCallback(async (decodedText: string) => {
        if (processing) return;

        setProcessing(true);
        scanningRef.current = false;

        // Vibrate on scan
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        try {
            addLog(`Processing QR data (${decodedText.length} chars)`);

            // Decrypt QR data
            const payload = decryptQRData(decodedText);

            if (!payload || !isValidQRPayload(payload)) {
                addLog('Invalid payload');
                setScanResult({
                    success: false,
                    message: 'Invalid QR code. Not a valid KAIZEN pass.',
                });
                return;
            }

            addLog(`Valid payload for: ${payload.name}`);

            // Validate event
            if (payload.eventId !== selectedEvent) {
                const eventName = events.find((e) => e.id === payload.eventId)?.name || 'another event';
                setScanResult({
                    success: false,
                    message: `This pass is for "${eventName}", not the selected event.`,
                    data: payload,
                    attendeeName: payload.name,
                });
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
    }, [processing, selectedEvent, events, coordinator, addLog]);

    const scanQRCode = useCallback(() => {
        if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
            animationRef.current = requestAnimationFrame(scanQRCode);
            return;
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data and scan for QR code
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data && code.data !== lastScannedRef.current) {
                addLog(`QR Code found: ${code.data.substring(0, 30)}...`);
                lastScannedRef.current = code.data;
                handleScanSuccess(code.data);
                return; // Stop scanning while processing
            }
        } catch (err) {
            // Ignore scanning errors, just continue
            console.log('Scan frame error:', err);
        }

        // Continue scanning
        animationRef.current = requestAnimationFrame(scanQRCode);
    }, [addLog, handleScanSuccess]);

    const startScanning = async () => {
        if (!selectedEvent) {
            toast.error('Please select an event first');
            return;
        }

        setCameraError('');
        setIsInitializing(true);
        setScanResult(null);
        lastScannedRef.current = '';
        setDebugLogs([]);

        addLog('=== STARTING CAMERA ===');
        addLog(`Platform: ${navigator.platform}`);
        addLog(`UserAgent: ${navigator.userAgent.substring(0, 60)}...`);
        addLog(`Secure: ${window.isSecureContext}`);
        addLog(`URL: ${window.location.href}`);

        // Check for HTTPS
        if (!window.isSecureContext) {
            addLog('ERROR: Not secure context');
            setCameraError('Camera requires HTTPS. Please use https://kaizen-ritp.in');
            setIsInitializing(false);
            return;
        }

        // Check if mediaDevices API is available
        if (!navigator.mediaDevices) {
            addLog('ERROR: navigator.mediaDevices is undefined');
            setCameraError('Camera API not available. Please use Chrome browser.');
            setIsInitializing(false);
            return;
        }

        if (!navigator.mediaDevices.getUserMedia) {
            addLog('ERROR: getUserMedia is undefined');
            setCameraError('Camera API not supported. Please update your browser.');
            setIsInitializing(false);
            return;
        }

        addLog('mediaDevices API available');

        // Stop any existing stream
        stopCamera();
        await new Promise(resolve => setTimeout(resolve, 300));

        // Try different camera constraints
        const constraintsList = [
            // Most compatible - no facing mode
            { video: true, audio: false },
            // Try back camera
            { video: { facingMode: 'environment' }, audio: false },
            // Try with ideal
            { video: { facingMode: { ideal: 'environment' } }, audio: false },
            // Try front camera as fallback
            { video: { facingMode: 'user' }, audio: false },
        ];

        let stream: MediaStream | null = null;
        let lastError: Error | null = null;

        for (let i = 0; i < constraintsList.length; i++) {
            const constraints = constraintsList[i];
            addLog(`Attempt ${i + 1}/${constraintsList.length}: ${JSON.stringify(constraints.video)}`);

            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                addLog(`SUCCESS! Got stream with ${stream.getTracks().length} tracks`);
                stream.getTracks().forEach(track => {
                    addLog(`Track: ${track.kind} - ${track.label} - ${track.readyState}`);
                });
                break;
            } catch (err) {
                const error = err as Error;
                lastError = error;
                addLog(`Failed: ${error.name} - ${error.message}`);
                
                // If permission denied, don't try other constraints
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    addLog('Permission denied - stopping attempts');
                    break;
                }
            }
        }

        if (!stream) {
            addLog('ALL ATTEMPTS FAILED');
            setIsInitializing(false);
            
            if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
                setCameraError('CAMERA_PERMISSION_DENIED');
            } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
                setCameraError('No camera found on this device.');
            } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
                setCameraError('CAMERA_IN_USE');
            } else {
                setCameraError(`Camera error: ${lastError?.message || 'Unknown error'}`);
            }
            return;
        }

        // Connect stream to video element
        streamRef.current = stream;

        if (videoRef.current) {
            addLog('Connecting stream to video element...');
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('autoplay', 'true');
            videoRef.current.muted = true;

            try {
                await videoRef.current.play();
                addLog(`Video playing: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                
                // Wait a moment for video to stabilize
                await new Promise(resolve => setTimeout(resolve, 500));
                
                addLog(`Video dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                
                setIsScanning(true);
                setIsInitializing(false);
                scanningRef.current = true;
                
                // Start QR scanning loop
                addLog('Starting QR scan loop...');
                animationRef.current = requestAnimationFrame(scanQRCode);
                
                toast.success('Camera ready! Point at QR code.');
            } catch (playError) {
                const err = playError as Error;
                addLog(`Video play error: ${err.name} - ${err.message}`);
                setCameraError('Could not start video. Please try again.');
                setIsInitializing(false);
                stopCamera();
            }
        }
    };

    const resumeScanning = useCallback(() => {
        lastScannedRef.current = '';
        setProcessing(false);
        setScanResult(null);
        
        if (isScanning && videoRef.current && videoRef.current.srcObject) {
            scanningRef.current = true;
            animationRef.current = requestAnimationFrame(scanQRCode);
        }
    }, [isScanning, scanQRCode]);

    // Manual verification code lookup
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
            const { data: regIds, error: regError } = await supabase
                .from('registrations')
                .select('id')
                .eq('event_id', selectedEvent);

            if (regError) throw regError;

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

            const { error: insertError } = await supabase.from('attendance').insert({
                registration_id: matchedRegId,
                event_id: selectedEvent,
                marked_by: coordinator?.id,
                marked_at: new Date().toISOString(),
            });

            if (insertError) throw insertError;

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
        stopCamera();
        localStorage.removeItem('coordinator');
        navigate('/coordinator/login');
    };

    if (!coordinator) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            {/* Header */}
            <header className="bg-black/80 border-b border-red-600/30 p-3 sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-red-500">KAIZEN Scanner</h1>
                        <p className="text-xs text-gray-400">{coordinator.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            <main className="p-3 max-w-lg mx-auto">
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
                            stopCamera();
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
                                {/* Video Container */}
                                <div className={`relative ${!isScanning && !isInitializing ? 'hidden' : ''}`}>
                                    <video
                                        ref={videoRef}
                                        className="w-full"
                                        playsInline
                                        autoPlay
                                        muted
                                        style={{ minHeight: '300px', background: '#000' }}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="hidden"
                                    />
                                    {/* Scanning overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-64 h-64 border-2 border-red-500 rounded-lg relative">
                                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg"></div>
                                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg"></div>
                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg"></div>
                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scanning Controls */}
                                {isScanning && !scanResult && (
                                    <div className="p-3 bg-black/60 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-green-400 text-sm">Scanning...</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={stopCamera}
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
                                        <p className="text-gray-500 text-xs mt-2">Please allow camera access when prompted</p>
                                    </div>
                                )}

                                {/* Error State */}
                                {!isScanning && !isInitializing && cameraError && !scanResult && (
                                    <div className="flex flex-col items-center justify-center bg-red-900/20 p-4 min-h-[280px]">
                                        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />

                                        {cameraError === 'CAMERA_PERMISSION_DENIED' ? (
                                            <>
                                                <p className="text-red-400 text-center text-sm mb-3">
                                                    Camera permission denied
                                                </p>
                                                <div className="bg-black/60 rounded-lg p-4 mb-4 text-left w-full max-w-sm">
                                                    <p className="text-red-500 text-sm font-bold mb-3">🔴 STEP 1: Android App Permission</p>
                                                    <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside mb-4">
                                                        <li>Go to <span className="text-white font-bold">Phone Settings</span></li>
                                                        <li>Tap <span className="text-white font-bold">"Apps"</span></li>
                                                        <li>Find <span className="text-white font-bold">"Chrome"</span></li>
                                                        <li>Tap <span className="text-white font-bold">"Permissions" → "Camera"</span></li>
                                                        <li>Select <span className="text-green-400 font-bold">"Allow"</span></li>
                                                    </ol>
                                                    
                                                    <div className="pt-3 border-t border-gray-700">
                                                        <p className="text-yellow-400 text-sm font-bold mb-3">🟡 STEP 2: Reset Site Permission</p>
                                                        <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                                                            <li>Tap <span className="text-white font-bold">ⓘ</span> icon left of URL</li>
                                                            <li>Tap <span className="text-white font-bold">"Site settings"</span></li>
                                                            <li>Tap <span className="text-white font-bold">"Clear & reset"</span></li>
                                                            <li>Reload and allow camera</li>
                                                        </ol>
                                                    </div>
                                                </div>
                                            </>
                                        ) : cameraError === 'CAMERA_IN_USE' ? (
                                            <>
                                                <p className="text-red-400 text-center text-sm mb-3">
                                                    Camera is busy
                                                </p>
                                                <div className="bg-black/60 rounded-lg p-4 mb-4 text-left w-full max-w-sm">
                                                    <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                                                        <li>Close other apps using camera</li>
                                                        <li>Close other browser tabs</li>
                                                        <li>Restart Chrome</li>
                                                    </ol>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-red-400 text-center text-sm mb-3">{cameraError}</p>
                                        )}

                                        <div className="flex gap-2 flex-wrap justify-center">
                                            <Button
                                                onClick={() => window.location.reload()}
                                                size="sm"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-1" />
                                                Refresh Page
                                            </Button>
                                            <Button
                                                onClick={() => setActiveTab('manual')}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Keyboard className="w-4 h-4 mr-1" />
                                                Use Code
                                            </Button>
                                        </div>
                                        
                                        {/* Debug Toggle */}
                                        <Button
                                            onClick={() => setShowDebug(!showDebug)}
                                            size="sm"
                                            variant="ghost"
                                            className="mt-3 text-gray-500"
                                        >
                                            {showDebug ? 'Hide' : 'Show'} Debug Logs
                                        </Button>
                                        
                                        {showDebug && debugLogs.length > 0 && (
                                            <div className="mt-3 bg-black/80 rounded-lg p-3 text-left w-full max-w-sm max-h-48 overflow-y-auto">
                                                <p className="text-yellow-400 text-xs font-semibold mb-2">Debug Logs:</p>
                                                {debugLogs.map((log, i) => (
                                                    <p key={i} className="text-gray-400 text-xs font-mono break-all">{log}</p>
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

                                        <div className="flex gap-2 justify-center">
                                            <Button
                                                onClick={resumeScanning}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                <Camera className="w-4 h-4 mr-2" />
                                                Scan Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Manual Code Entry Tab */}
                    <TabsContent value="manual" className="mt-4">
                        <Card className="bg-black/40 border-red-600/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                                    <Search className="w-4 h-4" />
                                    Enter Verification Code
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500 text-xs mb-3">
                                    Enter the 8-character code from the attendee's pass
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                                        placeholder="e.g., A1B2C3D4"
                                        maxLength={8}
                                        className="bg-black/40 border-red-600/30 text-center text-lg font-mono tracking-widest uppercase"
                                        disabled={verifyingCode}
                                    />
                                    <Button
                                        onClick={verifyByCode}
                                        disabled={verificationCode.length !== 8 || verifyingCode || !selectedEvent}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {verifyingCode ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            'Verify'
                                        )}
                                    </Button>
                                </div>

                                {/* Manual Result */}
                                {scanResult && activeTab === 'manual' && (
                                    <div
                                        className={`mt-4 p-4 rounded-lg ${scanResult.success
                                            ? 'bg-green-900/30'
                                            : scanResult.alreadyMarked
                                                ? 'bg-yellow-900/30'
                                                : 'bg-red-900/30'
                                            }`}
                                    >
                                        {scanResult.success ? (
                                            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                        ) : scanResult.alreadyMarked ? (
                                            <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                                        ) : (
                                            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                                        )}

                                        {scanResult.attendeeName && (
                                            <p className="text-white text-center font-bold">{scanResult.attendeeName}</p>
                                        )}
                                        <p className="text-gray-300 text-center text-sm mt-1">{scanResult.message}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Recent Scans */}
                {recentScans.length > 0 && (
                    <Card className="bg-black/40 border-red-600/30">
                        <CardHeader className="pb-2 pt-3">
                            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Recent Scans
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {recentScans.map((scan, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-black/40 rounded text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            {scan.success ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className="text-white">{scan.name}</span>
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
