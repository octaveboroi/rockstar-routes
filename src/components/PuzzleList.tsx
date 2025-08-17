import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Calendar, Target } from "lucide-react";
import { ClimbingPuzzle } from "@/pages/AdminPanel";

interface PuzzleListProps {
  puzzles: ClimbingPuzzle[];
  onEdit: (puzzle: ClimbingPuzzle) => void;
  onDelete: (puzzleId: string) => void;
}

export const PuzzleList = ({ puzzles, onEdit, onDelete }: PuzzleListProps) => {
  if (puzzles.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No puzzles created yet.</p>
          <p className="text-sm text-muted-foreground">Create your first climbing puzzle above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Puzzles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {puzzles.map((puzzle) => (
          <Card key={puzzle.id} className="overflow-hidden">
            <div className="aspect-video relative overflow-hidden">
              <img
                src={puzzle.imageUrl}
                alt={puzzle.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 text-white">
                <div className="flex items-center gap-1 text-sm">
                  <Target className="h-4 w-4" />
                  {puzzle.circles.length} holds
                </div>
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{puzzle.name}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(puzzle.createdAt).toLocaleDateString()}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(puzzle)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(puzzle.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};