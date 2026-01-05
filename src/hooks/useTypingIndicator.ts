import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTypingIndicator(conversationId: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTypingUsers((prev) => new Set([...prev, payload.user_id]));
          
          // Auto-remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(payload.user_id);
              return next;
            });
          }, 3000);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(payload.user_id);
            return next;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id },
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current && user) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'stop_typing',
          payload: { user_id: user.id },
        });
      }
    }, 2000);
  }, [user]);

  const stopTyping = useCallback(() => {
    if (!channelRef.current || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { user_id: user.id },
    });
  }, [user]);

  return { typingUsers, sendTyping, stopTyping };
}
