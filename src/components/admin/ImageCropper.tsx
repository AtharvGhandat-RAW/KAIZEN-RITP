import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number; // width / height
}

export function ImageCropper({ open, onOpenChange, imageFile, onCropComplete, aspectRatio = 1 }: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState([1]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setZoom([1]);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!imgRef.current || !containerRef.current) return;
    setProcessing(true);

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cropWidth = 250;
        const cropHeight = 250 / aspectRatio;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Fill background (optional, for transparency)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const scale = zoom[0];
        
        // Dimensions of the image as displayed in the DOM (before transform scale)
        const displayedWidth = imgRef.current.width;
        const displayedHeight = imgRef.current.height;

        // Dimensions to draw on canvas
        const drawnWidth = displayedWidth * scale;
        const drawnHeight = displayedHeight * scale;

        // Position to draw on canvas
        // Center of canvas + offset - half of drawn size
        const dx = (canvas.width / 2) + offset.x - (drawnWidth / 2);
        const dy = (canvas.height / 2) + offset.y - (drawnHeight / 2);

        ctx.drawImage(
            imgRef.current, 
            dx, 
            dy, 
            drawnWidth, 
            drawnHeight
        );
        
        canvas.toBlob((blob) => {
            if (blob) onCropComplete(blob);
            setProcessing(false);
            onOpenChange(false);
        }, 'image/jpeg', 0.9);

    } catch (e) {
        console.error(e);
        setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Crop QR Code</DialogTitle>
        </DialogHeader>
        
        <div 
            className="relative w-full h-[300px] bg-black overflow-hidden flex items-center justify-center cursor-move select-none rounded-md border border-zinc-800"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {imageSrc && (
                <img 
                    ref={imgRef}
                    src={imageSrc} 
                    alt="Crop target"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom[0]})`,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                    draggable={false}
                />
            )}
            
            {/* Overlay to show crop area */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/50">
                {/* The "hole" */}
                <div 
                    style={{ 
                        width: '250px', 
                        height: `${250 / aspectRatio}px`, 
                        border: '2px solid white',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                        background: 'transparent'
                    }} 
                />
            </div>
        </div>

        <div className="py-4">
            <label className="text-xs text-zinc-400 mb-2 block">Zoom</label>
            <Slider 
                value={zoom} 
                min={0.5} 
                max={3} 
                step={0.1} 
                onValueChange={setZoom} 
            />
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCrop} disabled={processing} className="bg-red-600 hover:bg-red-700">
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crop & Upload
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
