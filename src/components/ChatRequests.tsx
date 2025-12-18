import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';

export function ChatRequests() {
  const { chatRequests, acceptChatRequest, rejectChatRequest } = useChat();

  if (chatRequests.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No pending requests
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {chatRequests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.from_profile?.avatar_url || ''} />
              <AvatarFallback>
                {request.from_profile?.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {request.from_profile?.display_name || 'Anonymous'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => acceptChatRequest(request.id, request.from_user_id)}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => rejectChatRequest(request.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
