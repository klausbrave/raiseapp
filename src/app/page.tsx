'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Circle, Download } from 'lucide-react';

export default function Home() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      setPhoto(null); // Reset photo when opening camera
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg');
        setPhoto(photoData);
        
        // Stop the camera stream
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const downloadPhoto = () => {
    if (photo) {
      const link = document.createElement('a');
      link.href = photo;
      link.download = `photo-${new Date().toISOString()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">
        Raise - a new way to grow well
      </h1>

      <div className="flex flex-col items-center gap-6">
        {!stream && !photo && (
          <button
            onClick={openCamera}
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-md transition-colors"
            aria-label="Open camera"
          >
            <Camera size={24} />
          </button>
        )}

        {stream && (
          <>
            <div className="rounded-lg shadow-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-[300px] h-[400px] object-cover"
              />
            </div>
            <button
              onClick={capturePhoto}
              className="bg-white hover:bg-gray-100 p-4 rounded-full shadow-md transition-colors"
              aria-label="Take photo"
            >
              <Circle size={24} className="text-red-500" />
            </button>
          </>
        )}

        {photo && (
          <>
            <div className="rounded-lg shadow-lg overflow-hidden">
              <img 
                src={photo} 
                alt="Captured photo" 
                className="w-[300px] h-[400px] object-cover"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={downloadPhoto}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-md transition-colors"
                aria-label="Download photo"
              >
                <Download size={24} />
              </button>
              <button
                onClick={openCamera}
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-md transition-colors"
                aria-label="Take new photo"
              >
                <Camera size={24} />
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
