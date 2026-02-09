import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
}

export function useBlogPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: blogData, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      setLoading(false);
      return;
    }

    if (!blogData || blogData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Fetch author profiles
    const userIds = [...new Set(blogData.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    const enriched: BlogPost[] = blogData.map((post) => {
      const profile = profileMap.get(post.user_id);
      return {
        ...post,
        author_name: profile?.display_name || 'Anonymous',
        author_avatar: profile?.avatar_url || undefined,
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (
    title: string,
    content: string,
    category: string,
    imageFile?: File
  ) => {
    if (!user) return;

    let imageUrl: string | null = null;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        toast.error('Failed to upload image');
        console.error(uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('blog_posts').insert({
      user_id: user.id,
      title,
      content,
      category,
      image_url: imageUrl,
    });

    if (error) {
      toast.error('Failed to create post');
      console.error(error);
      return;
    }

    toast.success('Post published!');
    fetchPosts();
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast.error('Failed to delete post');
      return;
    }

    toast.success('Post deleted');
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return { posts, loading, createPost, deletePost, refetch: fetchPosts };
}
