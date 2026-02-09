import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { BlogPost } from '@/hooks/useBlogPosts';

interface BlogPostCardProps {
  post: BlogPost;
  onDelete: (id: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  fitness: '💪',
  wellness: '🧘',
  nutrition: '🥗',
  mindfulness: '🧠',
  sleep: '😴',
  motivation: '🔥',
};

export function BlogPostCard({ post, onDelete }: BlogPostCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === post.user_id;
  const initials = post.author_name
    ? post.author_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl shadow-card overflow-hidden transition-shadow hover:shadow-md">
      {post.image_url && (
        <div className="relative w-full h-40 sm:h-52">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-3">
        {/* Author row */}
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={post.author_avatar || undefined} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{post.author_name}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px] gap-0.5 shrink-0">
            {CATEGORY_EMOJI[post.category] || '📝'} {post.category}
          </Badge>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight mb-1">
            {post.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
            {post.content}
          </p>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive gap-1"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
