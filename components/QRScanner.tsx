import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from './ui';

/**
 * QRScanner Component Props
 */
interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (error: string) => void;
    isScanning: boolean;
    onClose: () => void;
}

const LAST_CAMERA_KEY = 'qrscanner:lastCameraId';

/**
 * QRScanner Component
 * 
 * Provides real-time QR code scanning using device camera
 * Uses html5-qrcode library for cross-browser compatibility
 * 
 * Features:
 * - Camera permission handling
 * - Real-time scanning
 * - Error handling
 * - Mobile and desktop support
 */
export const QRScanner: React.FC<QRScannerProps> = ({
    onScanSuccess,
    onScanError,
    isScanning,
    onClose,
}) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasDecodedRef = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string>('');
    const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');
    const [torchSupported, setTorchSupported] = useState(false);
    const [torchOn, setTorchOn] = useState(false);

    const beep = () => {
        try {
            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = 900;
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch {}
    };

    const haptic = () => {
        try {
            if ('vibrate' in navigator) navigator.vibrate(30);
        } catch {}
    };

    // Initialize scanner
    useEffect(() => {
        if (!isScanning) return;
        hasDecodedRef.current = false;

        const initScanner = async () => {
            try {
                // Get available cameras
                const devices = await Html5Qrcode.getCameras();
                
                if (devices && devices.length > 0) {
                    const cameraList = devices.map(device => ({
                        id: device.id,
                        label: device.label || `Camera ${device.id}`
                    }));
                    setCameras(cameraList);
                    
                    // Prefer last used camera, else back camera on mobile, else first available
                    const lastId = localStorage.getItem(LAST_CAMERA_KEY) || '';
                    const lastUsed = cameraList.find(c => c.id === lastId);
                    const backCamera = devices.find(device =>
                        (device.label || '').toLowerCase().includes('back') ||
                        (device.label || '').toLowerCase().includes('rear')
                    );
                    const defaultCamera = (lastUsed as any) || backCamera || devices[0];
                    setSelectedCamera(defaultCamera.id);
                    
                    // Initialize scanner instance
                    const scanner = new Html5Qrcode('qr-reader');
                    scannerRef.current = scanner;
                    
                    const config: any = {
                        fps: 25,
                        // Fixed large scan area to reduce aiming time
                        qrbox: { width: 320, height: 320 },
                        aspectRatio: 1.7778,
                        disableFlip: true,
                        // Only support QR codes to speed up detection
                        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                        // Try to use native BarCodeDetector if supported by the browser for speed
                        useBarCodeDetectorIfSupported: true,
                        // Prefer environment camera and continuous focus
                        videoConstraints: {
                            facingMode: 'environment',
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            // Some browsers honor this hint
                            focusMode: 'continuous',
                        },
                    };

                    // Start scanning
                    await scanner.start(
                        defaultCamera.id,
                        config,
                        (decodedText) => {
                            if (hasDecodedRef.current) return;
                            hasDecodedRef.current = true;
                            beep();
                            haptic();
                            onScanSuccess(decodedText);
                            stopScanner();
                        },
                        () => {
                            // Scanning errors can be ignored
                        }
                    );

                    // Remember selected camera for next time
                    localStorage.setItem(LAST_CAMERA_KEY, defaultCamera.id);

                    setIsReady(true);
                    setError('');

                    // Detect torch support (best-effort)
                    setTimeout(() => {
                        try {
                            const videoEl = document.querySelector('#qr-reader video') as HTMLVideoElement | null;
                            const stream = videoEl?.srcObject as MediaStream | undefined;
                            const track = stream?.getVideoTracks?.()[0];
                            // @ts-ignore - capabilities exist in supporting browsers
                            const caps = track?.getCapabilities?.();
                            if (caps && 'torch' in caps) {
                                setTorchSupported(true);
                            } else {
                                setTorchSupported(false);
                            }
                        } catch {
                            setTorchSupported(false);
                        }
                    }, 300);
                } else {
                    setError('No cameras found. Please check camera permissions.');
                    onScanError?.('No cameras found');
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to initialize camera';
                setError(errorMsg);
                onScanError?.(errorMsg);
                console.error('Scanner initialization error:', err);
            }
        };

        initScanner();

        // Cleanup on unmount or when scanning stops
        return () => {
            stopScanner();
        };
    }, [isScanning]);

    // Stop scanner function
    const stopScanner = async () => {
        if (scannerRef.current && (scannerRef.current as any).isScanning) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
        scannerRef.current = null;
        setIsReady(false);
        setTorchOn(false);
    };

    // Handle camera change
    const handleCameraChange = async (cameraId: string) => {
        if (!scannerRef.current) return;
        
        try {
            await stopScanner();
            setSelectedCamera(cameraId);
            localStorage.setItem(LAST_CAMERA_KEY, cameraId);
            hasDecodedRef.current = false;

            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;
            
            const config: any = {
                fps: 25,
                qrbox: { width: 320, height: 320 },
                aspectRatio: 1.7778,
                disableFlip: true,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                useBarCodeDetectorIfSupported: true,
                videoConstraints: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    focusMode: 'continuous',
                },
            };

            await scanner.start(
                cameraId,
                config,
                (decodedText) => {
                    if (hasDecodedRef.current) return;
                    hasDecodedRef.current = true;
                    beep();
                    haptic();
                    onScanSuccess(decodedText);
                    stopScanner();
                },
                () => {
                    // Scanning errors can be ignored
                }
            );
            
            setIsReady(true);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to switch camera';
            setError(errorMsg);
            onScanError?.(errorMsg);
        }
    };

    // Torch toggle (best-effort)
    const toggleTorch = async () => {
        try {
            const videoEl = document.querySelector('#qr-reader video') as HTMLVideoElement | null;
            const stream = videoEl?.srcObject as MediaStream | undefined;
            const track = stream?.getVideoTracks?.()[0];
            // @ts-ignore
            const caps = track?.getCapabilities?.();
            if (!track || !caps || !('torch' in caps)) {
                setTorchSupported(false);
                return;
            }
            const desired = !torchOn;
            await track.applyConstraints({ advanced: [{ torch: desired }] } as any);
            setTorchOn(desired);
        } catch (e) {
            console.error('Torch toggle error:', e);
            setTorchSupported(false);
        }
    };

    if (!isScanning) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-800">Scan QR Code</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                        aria-label="Close scanner"
                    >
                        ×
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="p-6">
                    {/* Camera Selector */}
                    {cameras.length > 1 && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Select Camera
                            </label>
                            <select
                                value={selectedCamera}
                                onChange={(e) => handleCameraChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                {cameras.map((camera) => (
                                    <option key={camera.id} value={camera.id}>
                                        {camera.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* QR Reader Container */}
                    <div className="relative">
                        <div
                            id="qr-reader"
                            className="w-full rounded-lg overflow-hidden"
                            style={{ minHeight: '320px' }}
                        />
                        
                        {/* Loading Overlay */}
                        {!isReady && !error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
                                    <p className="text-slate-600">Initializing camera...</p>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
                                <div className="text-center p-6">
                                    <svg
                                        className="w-12 h-12 text-red-500 mx-auto mb-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                    <p className="text-red-700 font-medium mb-2">Camera Error</p>
                                    <p className="text-red-600 text-sm mb-4">{error}</p>
                                    <Button variant="secondary" onClick={onClose}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    {isReady && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                📱 Position the QR code within the highlighted area
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                The scanner will automatically detect and read the code
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
                    {torchSupported && (
                        <Button variant="secondary" onClick={toggleTorch}>
                            {torchOn ? 'Turn Off Flash' : 'Turn On Flash'}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
