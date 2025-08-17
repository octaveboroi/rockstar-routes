import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { ClimbingPuzzle } from "@/pages/AdminPanel";

interface ClimberPhotoViewerProps {
  puzzle: ClimbingPuzzle;
  selectedCircleId: string | null;
  onCircleSelect: (circleId: string | null) => void;
  disabled?: boolean;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const ClimberPhotoViewer = ({ 
  puzzle, 
  selectedCircleId, 
  onCircleSelect, 
  disabled = false 
}: ClimberPhotoViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load and setup image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      // Fit image to container initially
      if (containerRef.current) {
        const container = containerRef.current;
        const scaleX = container.clientWidth / img.naturalWidth;
        const scaleY = container.clientHeight / img.naturalHeight;
        const scale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% of container
        setViewState({
          scale,
          offsetX: (container.clientWidth - img.naturalWidth * scale) / 2,
          offsetY: (container.clientHeight - img.naturalHeight * scale) / 2,
        });
      }
    };
    img.src = puzzle.imageUrl;
  }, [puzzle.imageUrl]);

  // Draw everything on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img || !imageLoaded) return;

    // Set canvas size to container size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(
      img,
      viewState.offsetX,
      viewState.offsetY,
      img.naturalWidth * viewState.scale,
      img.naturalHeight * viewState.scale
    );

    // Draw circles
    puzzle.circles.forEach((circle) => {
      const x = viewState.offsetX + circle.x * viewState.scale;
      const y = viewState.offsetY + circle.y * viewState.scale;
      const radius = 25 * viewState.scale;

      // Circle background
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      
      if (selectedCircleId === circle.id) {
        // Selected circle - bright orange
        ctx.fillStyle = '#ff6b35';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
      } else {
        // Regular circle - red
        ctx.fillStyle = '#e74c3c';
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
      }
      
      ctx.fill();
      ctx.stroke();

      // Number text
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${16 * viewState.scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(circle.number.toString(), x, y);

      // Selection highlight
      if (selectedCircleId === circle.id) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }, [puzzle.circles, viewState, selectedCircleId, imageLoaded]);

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if clicking on existing circle
    const clickedCircle = puzzle.circles.find((circle) => {
      const x = viewState.offsetX + circle.x * viewState.scale;
      const y = viewState.offsetY + circle.y * viewState.scale;
      const radius = 25 * viewState.scale;
      const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
      return distance <= radius;
    });

    if (clickedCircle) {
      // Toggle selection
      onCircleSelect(selectedCircleId === clickedCircle.id ? null : clickedCircle.id);
    } else {
      // Click outside circles - deselect
      onCircleSelect(null);
    }
  };

  // Handle mouse down for panning
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Always allow panning with left click when not clicking on circles
    setIsDragging(true);
    setDragStart({ x: event.clientX - viewState.offsetX, y: event.clientY - viewState.offsetY });
  };

  // Handle mouse move
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setViewState(prev => ({
        ...prev,
        offsetX: event.clientX - dragStart.x,
        offsetY: event.clientY - dragStart.y,
      }));
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel for zooming
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(5, viewState.scale * delta));
    
    // Zoom towards cursor position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      setViewState(prev => ({
        scale: newScale,
        offsetX: mouseX - (mouseX - prev.offsetX) * (newScale / prev.scale),
        offsetY: mouseY - (mouseY - prev.offsetY) * (newScale / prev.scale),
      }));
    }
  };

  const handleZoomIn = () => {
    setViewState(prev => ({ ...prev, scale: Math.min(5, prev.scale * 1.2) }));
  };

  const handleZoomOut = () => {
    setViewState(prev => ({ ...prev, scale: Math.max(0.2, prev.scale * 0.8) }));
  };

  const handleReset = () => {
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current;
      const img = imageRef.current;
      const scaleX = container.clientWidth / img.naturalWidth;
      const scaleY = container.clientHeight / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY, 1) * 0.9;
      setViewState({
        scale,
        offsetX: (container.clientWidth - img.naturalWidth * scale) / 2,
        offsetY: (container.clientHeight - img.naturalHeight * scale) / 2,
      });
    }
  };

  const selectedCircle = puzzle.circles.find(c => c.id === selectedCircleId);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <Button onClick={handleZoomIn} size="sm" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={handleZoomOut} size="sm" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button onClick={handleReset} size="sm" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <div className="flex-1" />
          
          <div className="text-sm text-muted-foreground flex items-center gap-4">
            {selectedCircle && (
              <span className="text-primary font-medium">
                Selected: Hold #{selectedCircle.number}
              </span>
            )}
            <span>Zoom: {Math.round(viewState.scale * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 ${
                disabled ? 'cursor-not-allowed' : 'cursor-grab'
              } ${isDragging ? 'cursor-grabbing' : ''}`}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-1">
            {!disabled ? (
              <>
                <p><strong>Tap red circles</strong> to select your route hold</p>
                <p><strong>Drag</strong> to pan around the image</p>
                <p><strong>Scroll</strong> to zoom in/out</p>
                <p><strong>Orange circle</strong> shows your current selection</p>
              </>
            ) : (
              <p className="text-center font-medium">Selection submitted - viewing only</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};