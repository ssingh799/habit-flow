import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceState {
  user_id: string;
  online_at: string;
}

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = new Set<string>();
        Object.keys(state).forEach((key) => {
          userIds.add(key);
        });
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers((prev) => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        // Store last seen time when user goes offline
        setLastSeen((prev) => new Map(prev).set(key, new Date().toISOString()));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const getLastSeen = useCallback(
    (userId: string) => lastSeen.get(userId) || null,
    [lastSeen]
  );

  return { onlineUsers, isOnline, lastSeen, getLastSeen };
}
