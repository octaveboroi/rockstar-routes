import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { ClimbingPuzzle } from "@/pages/AdminPanel";
import { toast } from "sonner";

interface PhotoEditorProps {
  puzzle: ClimbingPuzzle;
  onSave: (puzzle: ClimbingPuzzle) => void;
}

interface Circle {
  id: string;
  x: number;
  y: number;
  number: number;
  radius?: number; // Add radius property
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const PhotoEditor = ({ puzzle, onSave }: PhotoEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [circles, setCircles] = useState<Circle[]>(puzzle.circles.map(c => ({
    ...c,
    radius: c.radius || 20 // Default radius if not set
  })) || []);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDraggingCircle, setIsDraggingCircle] = useState(false);
  const [isResizingCircle, setIsResizingCircle] = useState(false);

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
        const scale = Math.min(scaleX, scaleY, 1) * 0.8; // 80% of container
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

    // Draw circles with transparency
    circles.forEach((circle) => {
      const x = viewState.offsetX + circle.x * viewState.scale;
      const y = viewState.offsetY + circle.y * viewState.scale;
      const radius = (circle.radius || 20) * viewState.scale;

      // Circle background with transparency
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      
      if (selectedCircle === circle.id) {
        ctx.fillStyle = 'hsla(14, 85%, 55%, 0.8)'; // Selected color with transparency
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
      } else {
        ctx.fillStyle = 'hsla(0, 85%, 55%, 0.7)'; // Regular color with transparency
        ctx.strokeStyle = 'hsla(195, 62%, 30%, 0.9)';
        ctx.lineWidth = 2;
      }
      
      ctx.fill();
      ctx.stroke();

      // Number text
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, 14 * viewState.scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(circle.number.toString(), x, y);

      // Selection highlight
      if (selectedCircle === circle.id) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 8, 0, 2 * Math.PI);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Resize handle for selected circle
        ctx.beginPath();
        ctx.arc(x + radius + 8, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = 'hsla(14, 85%, 55%, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [circles, viewState, selectedCircle, imageLoaded]);

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle canvas click and interaction
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if clicking on resize handle first
    if (selectedCircle) {
      const selectedCircleData = circles.find(c => c.id === selectedCircle);
      if (selectedCircleData) {
        const circleX = viewState.offsetX + selectedCircleData.x * viewState.scale;
        const circleY = viewState.offsetY + selectedCircleData.y * viewState.scale;
        const circleRadius = (selectedCircleData.radius || 20) * viewState.scale;
        const handleX = circleX + circleRadius + 8;
        const handleY = circleY;
        const handleDistance = Math.sqrt((clickX - handleX) ** 2 + (clickY - handleY) ** 2);
        
        if (handleDistance <= 6) {
          // Clicked on resize handle
          return;
        }
      }
    }

    // Check if clicking on existing circle
    const clickedCircle = circles.find((circle) => {
      const x = viewState.offsetX + circle.x * viewState.scale;
      const y = viewState.offsetY + circle.y * viewState.scale;
      const radius = (circle.radius || 20) * viewState.scale;
      const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
      return distance <= radius;
    });

    if (clickedCircle) {
      setSelectedCircle(selectedCircle === clickedCircle.id ? null : clickedCircle.id);
    } else {
      // Add new circle
      const imageX = (clickX - viewState.offsetX) / viewState.scale;
      const imageY = (clickY - viewState.offsetY) / viewState.scale;
      
      // Check if click is within image bounds
      const img = imageRef.current;
      if (img && imageX >= 0 && imageX <= img.naturalWidth && imageY >= 0 && imageY <= img.naturalHeight) {
        const newCircle: Circle = {
          id: Date.now().toString(),
          x: imageX,
          y: imageY,
          number: circles.length + 1,
          radius: 20, // Default radius
        };
        setCircles([...circles, newCircle]);
        setSelectedCircle(newCircle.id);
        toast("Hold added!");
      }
    }
  };

  // Handle mouse down for panning and circle dragging
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check if clicking on resize handle of selected circle
    if (selectedCircle) {
      const selectedCircleData = circles.find(c => c.id === selectedCircle);
      if (selectedCircleData) {
        const circleX = viewState.offsetX + selectedCircleData.x * viewState.scale;
        const circleY = viewState.offsetY + selectedCircleData.y * viewState.scale;
        const circleRadius = (selectedCircleData.radius || 20) * viewState.scale;
        const handleX = circleX + circleRadius + 8;
        const handleY = circleY;
        const handleDistance = Math.sqrt((mouseX - handleX) ** 2 + (mouseY - handleY) ** 2);
        
        if (handleDistance <= 6) {
          setIsResizingCircle(true);
          setDragStart({ x: mouseX, y: mouseY });
          return;
        }
      }
    }

    // Check if clicking on a circle for dragging
    const clickedCircle = circles.find((circle) => {
      const x = viewState.offsetX + circle.x * viewState.scale;
      const y = viewState.offsetY + circle.y * viewState.scale;
      const radius = (circle.radius || 20) * viewState.scale;
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      return distance <= radius;
    });

    if (clickedCircle && selectedCircle === clickedCircle.id) {
      // Start dragging the selected circle
      setIsDraggingCircle(true);
      setDragStart({ x: mouseX, y: mouseY });
    } else if (event.button === 2 || event.ctrlKey) { 
      // Right click or Ctrl+click for panning
      setIsDragging(true);
      setDragStart({ x: event.clientX - viewState.offsetX, y: event.clientY - viewState.offsetY });
    }
  };

  // Handle mouse move for panning and circle dragging
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (isDraggingCircle && selectedCircle) {
      // Move the selected circle
      const deltaX = (mouseX - dragStart.x) / viewState.scale;
      const deltaY = (mouseY - dragStart.y) / viewState.scale;
      
      setCircles(prev => prev.map(circle => 
        circle.id === selectedCircle 
          ? { ...circle, x: circle.x + deltaX, y: circle.y + deltaY }
          : circle
      ));
      
      setDragStart({ x: mouseX, y: mouseY });
    } else if (isResizingCircle && selectedCircle) {
      // Resize the selected circle
      const selectedCircleData = circles.find(c => c.id === selectedCircle);
      if (selectedCircleData) {
        const circleX = viewState.offsetX + selectedCircleData.x * viewState.scale;
        const currentDistance = Math.sqrt((mouseX - circleX) ** 2 + (mouseY - (viewState.offsetY + selectedCircleData.y * viewState.scale)) ** 2);
        const newRadius = Math.max(10, Math.min(50, currentDistance / viewState.scale));
        
        setCircles(prev => prev.map(circle => 
          circle.id === selectedCircle 
            ? { ...circle, radius: newRadius }
            : circle
        ));
      }
    } else if (isDragging) {
      // Pan the view
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
    setIsDraggingCircle(false);
    setIsResizingCircle(false);
  };

  // Handle wheel for zooming
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, viewState.scale * delta));
    
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
    setViewState(prev => ({ ...prev, scale: Math.max(0.1, prev.scale * 0.8) }));
  };

  const handleReset = () => {
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current;
      const img = imageRef.current;
      const scaleX = container.clientWidth / img.naturalWidth;
      const scaleY = container.clientHeight / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY, 1) * 0.8;
      setViewState({
        scale,
        offsetX: (container.clientWidth - img.naturalWidth * scale) / 2,
        offsetY: (container.clientHeight - img.naturalHeight * scale) / 2,
      });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCircle) {
      setCircles(prev => prev.filter(c => c.id !== selectedCircle));
      setSelectedCircle(null);
      toast("Hold removed!");
    }
  };

  const handleSave = () => {
    const updatedPuzzle: ClimbingPuzzle = {
      ...puzzle,
      circles: circles.map((circle, index) => ({
        ...circle,
        number: index + 1, // Renumber sequentially
      })),
    };
    onSave(updatedPuzzle);
  };

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
            {selectedCircle && (
              <>
                <Button onClick={handleDeleteSelected} size="sm" variant="destructive">
                  Delete Selected
                </Button>
                <div className="text-xs text-muted-foreground">
                  Drag to move • Drag handle to resize
                </div>
              </>
            )}
            <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            Holds: {circles.length} | Zoom: {Math.round(viewState.scale * 100)}%
          </div>
          <Button onClick={handleSave} className="bg-success-green hover:bg-success-green/90">
            <Save className="h-4 w-4 mr-2" />
            Save Puzzle
          </Button>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative h-[60vh] sm:h-[70vh] overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Click</strong> to add/select holds</p>
            <p><strong>Drag selected hold</strong> to move it</p>
            <p><strong>Drag white handle</strong> to resize selected hold</p>
            <p><strong>Right-click + drag</strong> or <strong>Ctrl + drag</strong> to pan</p>
            <p><strong>Scroll</strong> to zoom in/out</p>
            <p><strong>Selected hold</strong> appears in orange with dashed outline</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};