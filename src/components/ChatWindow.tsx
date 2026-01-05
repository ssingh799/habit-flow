import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { useChat, Conversation } from '@/hooks/useChat';
import { usePresence } from '@/hooks/usePresence';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { OnlineIndicator } from '@/components/OnlineIndicator';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useChat();
  const { isOnline, getLastSeen } = usePresence();
  const { typingUsers, sendTyping, stopTyping } = useTypingIndicator(conversation.id);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const otherUserId = conversation.other_user?.user_id || '';
  const otherUserOnline = isOnline(otherUserId);
  const otherUserLastSeen = getLastSeen(otherUserId);
  const isOtherUserTyping = typingUsers.has(otherUserId);

  useEffect(() => {
    fetchMessages(conversation.id);
    const unsubscribe = subscribeToMessages(conversation.id);
    return unsubscribe;
  }, [conversation.id, fetchMessages, subscribeToMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    stopTyping();
    await sendMessage(conversation.id, newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      sendTyping();
    } else {
      stopTyping();
    }
  };

  const getStatusText = () => {
    if (otherUserOnline) return 'Online';
    if (otherUserLastSeen) {
      return `Last seen ${formatDistanceToNow(new Date(otherUserLastSeen), { addSuffix: true })}`;
    }
    return 'Offline';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.other_user?.avatar_url || ''} />
            <AvatarFallback>
              {conversation.other_user?.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <OnlineIndicator
            isOnline={otherUserOnline}
            className="absolute bottom-0 right-0"
            size="sm"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">
            {conversation.other_user?.display_name || 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground">
            {isOtherUserTyping ? 'typing...' : getStatusText()}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2',
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                )}
              >
                <p className="break-words">{msg.content}</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  {format(new Date(msg.created_at), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
        {isOtherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
