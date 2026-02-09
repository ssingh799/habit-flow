import { useState, useRef } from 'react';
import { ImagePlus, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateBlogPostProps {
  onSubmit: (title: string, content: string, category: string, image?: File) => Promise<void>;
}

const BLOG_CATEGORIES = [
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'wellness', label: '🧘 Wellness' },
  { value: 'nutrition', label: '🥗 Nutrition' },
  { value: 'mindfulness', label: '🧠 Mindfulness' },
  { value: 'sleep', label: '😴 Sleep' },
  { value: 'motivation', label: '🔥 Motivation' },
];

export function CreateBlogPost({ onSubmit }: CreateBlogPostProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('wellness');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    await onSubmit(title.trim(), content.trim(), category, imageFile || undefined);
    setTitle('');
    setContent('');
    setCategory('wellness');
    clearImage();
    setSubmitting(false);
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Share a Post</h3>

      <Input
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        className="text-sm"
      />

      <Textarea
        placeholder="What's on your mind about fitness or wellness?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
        rows={3}
        className="text-sm resize-none"
      />

      {imagePreview && (
        <div className="relative rounded-lg overflow-hidden max-h-48">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover max-h-48" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLOG_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value} className="text-xs">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Image
        </Button>

        <div className="flex-1" />

        <Button
          size="sm"
          className="h-8 gradient-primary text-primary-foreground gap-1"
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !content.trim()}
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}
