import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mountain, Users, Trophy } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-earth-brown/20">
        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <Mountain className="mx-auto h-16 w-16 text-primary mb-6" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Climbing Contest
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create interactive climbing puzzles and compete with fellow climbers. 
              Test your route-reading skills on challenging boulder problems.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/admin">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  Admin Panel
                </Button>
              </Link>
              <Link to="/climber">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Start Climbing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Mountain className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle>Create Puzzles</CardTitle>
              <CardDescription>
                Upload climbing photos and mark holds with interactive circles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle>Compete</CardTitle>
              <CardDescription>
                Select your route and compete with other climbers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Trophy className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle>Rankings</CardTitle>
              <CardDescription>
                Climb the leaderboard with smart route choices
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;