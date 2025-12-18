import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { useChat, Profile } from '@/hooks/useChat';

interface UserSearchProps {
  onClose?: () => void;
}

export function UserSearch({ onClose }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const { searchResults, loading, searchUsers, sendChatRequest, sentRequests } = useChat();

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const hasSentRequest = (userId: string) => {
    return sentRequests.some(
      (r) => r.to_user_id === userId && r.status === 'pending'
    );
  };

  const handleSendRequest = async (userId: string) => {
    await sendChatRequest(userId);
    onClose?.();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback>
                    {profile.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {profile.display_name || 'Anonymous'}
                </span>
              </div>
              <Button
                size="sm"
                variant={hasSentRequest(profile.user_id) ? 'secondary' : 'default'}
                onClick={() => handleSendRequest(profile.user_id)}
                disabled={hasSentRequest(profile.user_id)}
              >
                {hasSentRequest(profile.user_id) ? (
                  'Requested'
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Request
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!loading && query && searchResults.length === 0 && (
        <p className="text-center text-muted-foreground py-4">
          No users found
        </p>
      )}
    </div>
  );
}
