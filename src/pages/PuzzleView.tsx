import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Target, Award } from "lucide-react";
import { ClimbingPuzzle } from "@/pages/AdminPanel";
import { ClimberPhotoViewer } from "@/components/ClimberPhotoViewer";
import { toast } from "sonner";

interface ClimberSelection {
  puzzleId: string;
  selectedCircleId: string | null;
  climberName: string;
  timestamp: Date;
}

const PuzzleView = () => {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<ClimbingPuzzle | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [climberName, setClimberName] = useState<string>("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [allSelections, setAllSelections] = useState<ClimberSelection[]>([]);

  useEffect(() => {
    // Load puzzle
    const savedPuzzles = localStorage.getItem('climbing-puzzles');
    if (savedPuzzles && id) {
      const puzzles: ClimbingPuzzle[] = JSON.parse(savedPuzzles);
      const foundPuzzle = puzzles.find(p => p.id === id);
      setPuzzle(foundPuzzle || null);
    }

    // Load selections
    const savedSelections = localStorage.getItem('climber-selections');
    if (savedSelections) {
      setAllSelections(JSON.parse(savedSelections));
    }

    // Get climber name from session storage or prompt
    let name = sessionStorage.getItem('climber-name');
    if (!name) {
      name = prompt('Enter your climber name:') || 'Anonymous';
      sessionStorage.setItem('climber-name', name);
    }
    setClimberName(name);
  }, [id]);

  const handleSaveSelection = () => {
    if (!puzzle || !selectedCircleId) {
      toast("Please select a hold first!");
      return;
    }

    const newSelection: ClimberSelection = {
      puzzleId: puzzle.id,
      selectedCircleId,
      climberName,
      timestamp: new Date(),
    };

    // Remove any previous selection from this climber for this puzzle
    const updatedSelections = allSelections.filter(
      s => !(s.puzzleId === puzzle.id && s.climberName === climberName)
    );
    updatedSelections.push(newSelection);

    setAllSelections(updatedSelections);
    localStorage.setItem('climber-selections', JSON.stringify(updatedSelections));
    setHasSubmitted(true);
    toast("Selection saved! Good luck!");
  };

  const getSelectedCircleNumber = () => {
    if (!puzzle || !selectedCircleId) return null;
    const circle = puzzle.circles.find(c => c.id === selectedCircleId);
    return circle?.number || null;
  };

  const getPuzzleRanking = () => {
    if (!puzzle) return [];
    
    const puzzleSelections = allSelections.filter(s => s.puzzleId === puzzle.id);
    const ranking = puzzleSelections.map(selection => {
      const circle = puzzle.circles.find(c => c.id === selection.selectedCircleId);
      return {
        climberName: selection.climberName,
        score: circle?.number || 0,
        timestamp: selection.timestamp,
      };
    });

    // Sort by score (lower is better) then by timestamp
    return ranking.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  };

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Puzzle not found.</p>
            <Link to="/climber">
              <Button className="mt-4">Back to Puzzles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ranking = getPuzzleRanking();
  const selectedNumber = getSelectedCircleNumber();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/climber">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">{puzzle.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo Viewer */}
          <div className="lg:col-span-2">
            <ClimberPhotoViewer
              puzzle={puzzle}
              selectedCircleId={selectedCircleId}
              onCircleSelect={setSelectedCircleId}
              disabled={hasSubmitted}
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Selection Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Your Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Climber</p>
                  <p className="font-medium">{climberName}</p>
                </div>
                
                {selectedCircleId ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Hold</p>
                    <p className="text-2xl font-bold text-primary">#{selectedNumber}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Tap a red circle to select your route</p>
                )}

                {!hasSubmitted ? (
                  <Button 
                    onClick={handleSaveSelection}
                    disabled={!selectedCircleId}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Submit Selection
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-success-green/10 rounded-lg">
                    <p className="text-success-green font-medium">Selection Submitted!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your choice: Hold #{selectedNumber}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <p className="text-muted-foreground text-center">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {ranking.map((entry, index) => (
                      <div
                        key={`${entry.climberName}-${entry.timestamp}`}
                        className={`flex items-center justify-between p-2 rounded ${
                          entry.climberName === climberName 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium w-6">#{index + 1}</span>
                          <span className={entry.climberName === climberName ? 'font-medium' : ''}>
                            {entry.climberName}
                          </span>
                        </div>
                        <span className="font-bold text-primary">
                          {entry.score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleView;