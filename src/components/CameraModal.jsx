import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Upload, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onImageCaptured, isAnalyzing }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported on this browser. Please use photo upload.');
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('[CameraModal] Camera permission/access error:', err);
      setCameraError('Unable to access device camera. Please allow camera permissions or upload an image file.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Client-side image optimization: Downscales captures to max 800px (<150KB) to guarantee fast Gemini Vision API delivery
  const processAndCapture = (sourceElement, origW, origH) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const MAX_DIM = 800;
    let w = origW || 640;
    let h = origH || 480;

    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) {
        h = Math.round((h * MAX_DIM) / w);
        w = MAX_DIM;
      } else {
        w = Math.round((w * MAX_DIM) / h);
        h = MAX_DIM;
      }
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceElement, 0, 0, w, h);

    const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    onImageCaptured(optimizedBase64);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    processAndCapture(video, video.videoWidth, video.videoHeight);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      processAndCapture(img, img.width, img.height);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', background: '#ffffff' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: '#f0f9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <Camera size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                Scan Glucometer Screen
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Align the display numbers within the frame box
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport Box */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '330px',
          borderRadius: 'var(--radius-md)',
          background: '#0f172a',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #cbd5e1',
        }}>
          {isAnalyzing ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Sparkles size={48} className="spin-animation" color="#7c3aed" style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
              <h4 style={{ color: '#ffffff', marginBottom: '6px', fontWeight: 700 }}>GlucoTrack AI Extracting Reading...</h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Analyzing digital LCD segments, measurement units, and meal context
              </p>
            </div>
          ) : cameraError ? (
            <div style={{ textAlign: 'center', padding: '20px', maxWidth: '85%' }}>
              <img
                src="/images/glucometer_scan_guide.jpg"
                alt="Glucometer OCR Scanning Guide"
                style={{ width: '180px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #334155' }}
              />
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '14px' }}>
                {cameraError}
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> Upload Photo Instead
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Animated Laser Scanner Sweep Line */}
              <div className="scanner-laser-line" />

              {/* Alignment Bounding Box with Corner Brackets */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '75%',
                height: '55%',
                border: '2px stroke #38bdf8',
                borderRadius: '12px',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  fontSize: '0.72rem',
                  color: '#38bdf8',
                  background: 'rgba(15,23,42,0.85)',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                }}>
                  Align Display Screen Here
                </div>
              </div>
            </>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {!isAnalyzing && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload image file from device"
            >
              <Upload size={16} /> File Upload
            </button>

            {!cameraError && (
              <button
                className="btn btn-primary"
                onClick={handleCapture}
                style={{ padding: '11px 26px', borderRadius: 'var(--radius-full)', fontSize: '0.95rem' }}
              >
                <Camera size={18} /> Capture Reading
              </button>
            )}

            {!cameraError && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={toggleCameraFacing}
                title="Switch camera"
              >
                <RefreshCw size={16} /> Switch
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
