import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ChatRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  other_user?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ChatRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Search users by name or email
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !user) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .or(`display_name.ilike.%${query}%`);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({ title: 'Error searching users', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch chat requests (received)
  const fetchChatRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_requests')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for requesters
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', request.from_user_id)
            .single();
          return { ...request, from_profile: profile };
        })
      );

      setChatRequests(requestsWithProfiles as ChatRequest[]);
    } catch (error: any) {
      console.error('Error fetching chat requests:', error);
    }
  }, [user]);

  // Fetch sent requests
  const fetchSentRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_requests')
        .select('*')
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', request.to_user_id)
            .single();
          return { ...request, to_profile: profile };
        })
      );

      setSentRequests(requestsWithProfiles as ChatRequest[]);
    } catch (error: any) {
      console.error('Error fetching sent requests:', error);
    }
  }, [user]);

  // Send chat request
  const sendChatRequest = useCallback(async (toUserId: string) => {
    if (!user) return;

    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from('chat_requests')
        .select('*')
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${user.id})`)
        .single();

      if (existing) {
        toast({ title: 'Request already exists', variant: 'destructive' });
        return;
      }

      // Check if conversation already exists
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${toUserId}),and(user1_id.eq.${toUserId},user2_id.eq.${user.id})`)
        .single();

      if (existingConvo) {
        toast({ title: 'You already have a conversation with this user' });
        return;
      }

      const { error } = await supabase
        .from('chat_requests')
        .insert({ from_user_id: user.id, to_user_id: toUserId });

      if (error) throw error;
      toast({ title: 'Chat request sent!' });
      fetchSentRequests();
    } catch (error: any) {
      toast({ title: 'Error sending request', description: error.message, variant: 'destructive' });
    }
  }, [user, toast, fetchSentRequests]);

  // Accept chat request
  const acceptChatRequest = useCallback(async (requestId: string, fromUserId: string) => {
    if (!user) return;

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('chat_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create conversation
      const { error: convoError } = await supabase
        .from('conversations')
        .insert({ user1_id: fromUserId, user2_id: user.id });

      if (convoError) throw convoError;

      toast({ title: 'Request accepted!' });
      fetchChatRequests();
      fetchConversations();
    } catch (error: any) {
      toast({ title: 'Error accepting request', description: error.message, variant: 'destructive' });
    }
  }, [user, toast, fetchChatRequests]);

  // Reject chat request
  const rejectChatRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('chat_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      toast({ title: 'Request rejected' });
      fetchChatRequests();
    } catch (error: any) {
      toast({ title: 'Error rejecting request', description: error.message, variant: 'destructive' });
    }
  }, [toast, fetchChatRequests]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithProfiles = await Promise.all(
        (data || []).map(async (convo) => {
          const otherUserId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', otherUserId)
            .single();

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return { ...convo, other_user: profile, last_message: lastMsg };
        })
      );

      setConversations(conversationsWithProfiles as Conversation[]);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error: any) {
      toast({ title: 'Error sending message', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  // Subscribe to new messages
  const subscribeToMessages = useCallback((conversationId: string) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchChatRequests();
      fetchSentRequests();
      fetchConversations();
    }
  }, [user, fetchChatRequests, fetchSentRequests, fetchConversations]);

  return {
    searchResults,
    chatRequests,
    sentRequests,
    conversations,
    messages,
    loading,
    searchUsers,
    sendChatRequest,
    acceptChatRequest,
    rejectChatRequest,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
    fetchConversations,
  };
}
