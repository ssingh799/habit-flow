import { BookOpen } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { CreateBlogPost } from './CreateBlogPost';
import { BlogPostCard } from './BlogPostCard';
import { Skeleton } from '@/components/ui/skeleton';

export function BlogFeed() {
  const { posts, loading, createPost, deletePost } = useBlogPosts();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Community Blog</h2>
      </div>

      <CreateBlogPost onSubmit={createPost} />

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-3">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No posts yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Be the first to share a fitness or wellness tip with the community!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} onDelete={deletePost} />
          ))}
        </div>
      )}
    </div>
  );
}
