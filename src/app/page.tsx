'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Circle, Share2, Loader2 } from 'lucide-react';

interface PlantIdentification {
  result: {
    classification: {
      suggestions: Array<{
        name: string;
        probability: number;
        similar_images?: Array<{ url: string }>;
      }>;
    };
  };
}

export default function Home() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [plantInfo, setPlantInfo] = useState<PlantIdentification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);

  // Add your API key here
  const API_KEY = process.env.NEXT_PUBLIC_PLANT_ID_API_KEY;

  if (!API_KEY) {
    console.error('Missing PLANT_ID_API_KEY environment variable');
  }

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
      setPhoto(null);
      setPlantInfo(null);
      setError(null);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Could not access camera');
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

        // Automatically identify the plant
        identifyPlant(photoData);
      }
    }
  };

  const identifyPlant = async (photoData: string) => {
    try {
      setIsIdentifying(true);
      setError(null);

      // Convert base64 to clean format (remove data:image/jpeg;base64, prefix)
      const base64Image = photoData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

      const response = await fetch('https://api.plant.id/v3/identification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': API_KEY,
        },
        body: JSON.stringify({
          images: [base64Image],
          health: 'auto',
          similar_images: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Plant identification failed');
      }

      const data: PlantIdentification = await response.json();
      setPlantInfo(data);
    } catch (error) {
      console.error('Error identifying plant:', error);
      setError('Failed to identify plant');
    } finally {
      setIsIdentifying(false);
    }
  };

  const sharePhoto = async () => {
    if (photo) {
      try {
        const response = await fetch(photo);
        const blob = await response.blob();
        const file = new File([blob], `photo-${new Date().toISOString()}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.share) {
          await navigator.share({
            files: [file],
            title: 'Share Photo',
          });
        } else {
          const link = document.createElement('a');
          link.href = photo;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('Error sharing photo:', error);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">
        Raise - a new way to grow well
      </h1>

      <div className="flex flex-col items-center gap-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

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
                ref={photoRef}
                src={photo} 
                alt="Captured photo" 
                className="w-[300px] h-[400px] object-cover"
              />
            </div>

            {isIdentifying ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="animate-spin" size={24} />
                <span>Identifying plant...</span>
              </div>
            ) : plantInfo ? (
              <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-bold mb-2">Plant Identification Results</h2>
                {plantInfo.result.classification.suggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="mb-4">
                    <p className="font-semibold">
                      {suggestion.name} ({(suggestion.probability * 100).toFixed(1)}%)
                    </p>
                    {suggestion.similar_images && suggestion.similar_images[0] && (
                      <img 
                        src={suggestion.similar_images[0].url} 
                        alt={`Similar ${suggestion.name}`}
                        className="w-20 h-20 object-cover rounded mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex gap-4">
              <button
                onClick={sharePhoto}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-md transition-colors"
                aria-label="Share photo"
              >
                <Share2 size={24} />
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
