import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogFeed } from '@/components/BlogFeed';
import { ThemeToggle } from '@/components/ThemeToggle';

const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="h-8 sm:h-9 px-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Community Blog</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <BlogFeed />
      </main>
    </div>
  );
};

export default Blog;
