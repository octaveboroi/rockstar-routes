import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Save, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { PhotoEditor } from "@/components/PhotoEditor";
import { PuzzleList } from "@/components/PuzzleList";
import { toast } from "sonner";

export interface ClimbingPuzzle {
  id: string;
  name: string;
  imageUrl: string;
  circles: Array<{
    id: string;
    x: number;
    y: number;
    number: number;
  }>;
  createdAt: Date;
}

const AdminPanel = () => {
  const [puzzles, setPuzzles] = useState<ClimbingPuzzle[]>(() => {
    const saved = localStorage.getItem('climbing-puzzles');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPuzzle, setCurrentPuzzle] = useState<ClimbingPuzzle | null>(null);
  const [puzzleName, setPuzzleName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      toast("Image uploaded successfully!");
    }
  };

  const handleCreatePuzzle = () => {
    if (!puzzleName.trim()) {
      toast("Please enter a puzzle name");
      return;
    }
    if (!imageUrl) {
      toast("Please upload an image");
      return;
    }

    const newPuzzle: ClimbingPuzzle = {
      id: Date.now().toString(),
      name: puzzleName,
      imageUrl,
      circles: [],
      createdAt: new Date(),
    };

    setCurrentPuzzle(newPuzzle);
    setPuzzleName("");
  };

  const handleSavePuzzle = (updatedPuzzle: ClimbingPuzzle) => {
    const updatedPuzzles = [...puzzles.filter(p => p.id !== updatedPuzzle.id), updatedPuzzle];
    setPuzzles(updatedPuzzles);
    localStorage.setItem('climbing-puzzles', JSON.stringify(updatedPuzzles));
    setCurrentPuzzle(null);
    setImageUrl("");
    setSelectedImage(null);
    toast("Puzzle saved successfully!");
  };

  const handleEditPuzzle = (puzzle: ClimbingPuzzle) => {
    setCurrentPuzzle(puzzle);
    setImageUrl(puzzle.imageUrl);
    setPuzzleName(puzzle.name);
  };

  const handleDeletePuzzle = (puzzleId: string) => {
    const updatedPuzzles = puzzles.filter(p => p.id !== puzzleId);
    setPuzzles(updatedPuzzles);
    localStorage.setItem('climbing-puzzles', JSON.stringify(updatedPuzzles));
    toast("Puzzle deleted");
  };

  if (currentPuzzle) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPuzzle(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <h1 className="text-2xl font-bold">Edit: {currentPuzzle.name}</h1>
          </div>
          
          <PhotoEditor
            puzzle={currentPuzzle}
            onSave={handleSavePuzzle}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
        </div>

        {/* Create New Puzzle */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Puzzle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="puzzleName">Puzzle Name</Label>
              <Input
                id="puzzleName"
                value={puzzleName}
                onChange={(e) => setPuzzleName(e.target.value)}
                placeholder="Enter puzzle name..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="imageUpload">Upload Photo</Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="imageUpload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
                {selectedImage && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedImage.name}
                  </p>
                )}
              </div>
            </div>

            <Button onClick={handleCreatePuzzle} className="w-full sm:w-auto">
              Create Puzzle
            </Button>
          </CardContent>
        </Card>

        {/* Existing Puzzles */}
        <PuzzleList
          puzzles={puzzles}
          onEdit={handleEditPuzzle}
          onDelete={handleDeletePuzzle}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
