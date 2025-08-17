import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, Users, Calendar } from "lucide-react";
import { ClimbingPuzzle } from "@/pages/AdminPanel";

const ClimberView = () => {
  const navigate = useNavigate();
  const [puzzles, setPuzzles] = useState<ClimbingPuzzle[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('climbing-puzzles');
    if (saved) {
      setPuzzles(JSON.parse(saved));
    }
  }, []);

  const handleSelectPuzzle = (puzzleId: string) => {
    navigate(`/puzzle/${puzzleId}`);
  };

  if (puzzles.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Choose Your Challenge</h1>
          </div>

          <Card className="text-center">
            <CardContent className="py-12">
              <Target className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Puzzles Available</h2>
              <p className="text-muted-foreground mb-4">
                No climbing puzzles have been created yet.
              </p>
              <Link to="/admin">
                <Button>Create First Puzzle</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Choose Your Challenge</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {puzzles.map((puzzle) => (
            <Card key={puzzle.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <div 
                className="aspect-video relative overflow-hidden"
                onClick={() => handleSelectPuzzle(puzzle.id)}
              >
                <img
                  src={puzzle.imageUrl}
                  alt={puzzle.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <h3 className="text-lg font-bold mb-1">{puzzle.name}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {puzzle.circles.length} holds
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(puzzle.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4">
                <Button 
                  onClick={() => handleSelectPuzzle(puzzle.id)}
                  className="w-full"
                >
                  Start Climbing
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClimberView;