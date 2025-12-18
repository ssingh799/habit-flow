import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat, Conversation } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatListProps {
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export function ChatList({ selectedConversation, onSelectConversation }: ChatListProps) {
  const { conversations } = useChat();

  if (conversations.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No conversations yet. Search for users to start chatting!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((convo) => (
        <div
          key={convo.id}
          onClick={() => onSelectConversation(convo.id)}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
            selectedConversation === convo.id
              ? 'bg-primary/10 border border-primary/20'
              : 'bg-muted/50 hover:bg-muted'
          )}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={convo.other_user?.avatar_url || ''} />
            <AvatarFallback>
              {convo.other_user?.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <p className="font-medium truncate">
                {convo.other_user?.display_name || 'Anonymous'}
              </p>
              {convo.last_message && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(convo.last_message.created_at), { addSuffix: true })}
                </span>
              )}
            </div>
            {convo.last_message && (
              <p className="text-sm text-muted-foreground truncate">
                {convo.last_message.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
