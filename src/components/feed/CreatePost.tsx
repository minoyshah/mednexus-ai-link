import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toggle } from '@/components/ui/toggle';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  FlaskConical, 
  Scale, 
  GraduationCap, 
  Building2,
  Image,
  Paperclip,
  Bold,
  Italic,
  List,
  Link2,
  X,
  Loader2
} from 'lucide-react';

const CATEGORIES = [
  { value: 'clinical', label: 'Clinical', icon: FileText },
  { value: 'research', label: 'Research', icon: FlaskConical },
  { value: 'policy', label: 'Policy', icon: Scale },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'industry', label: 'Industry', icon: Building2 },
];

interface CreatePostProps {
  onPostCreated?: () => void;
}

interface AttachedFile {
  file: File;
  preview?: string;
  type: 'image' | 'file';
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    list: false,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments(prev => [...prev, {
            file,
            preview: e.target?.result as string,
            type: 'image'
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      setAttachments(prev => [...prev, {
        file,
        type: 'file'
      }]);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const applyFormatting = (type: 'bold' | 'italic' | 'list') => {
    setFormatting(prev => ({ ...prev, [type]: !prev[type] }));
    
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = selectedText;
    let prefix = '';
    let suffix = '';
    
    switch (type) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '_';
        suffix = '_';
        break;
      case 'list':
        prefix = '\n- ';
        suffix = '';
        break;
    }
    
    if (selectedText) {
      formattedText = prefix + selectedText + suffix;
      setContent(content.substring(0, start) + formattedText + content.substring(end));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !category) {
      toast({
        title: 'Missing information',
        description: 'Please add content and select a category.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase.from('posts').insert({
      author_id: user?.id,
      content: content.trim(),
      category: category as 'clinical' | 'research' | 'policy' | 'education' | 'industry',
      post_type: 'text' as const,
    });

    setIsSubmitting(false);
    if (error) {
      toast({
        title: 'Error creating post',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Post created',
        description: 'Your post has been shared with the community.',
      });
      setContent('');
      setCategory('');
      setAttachments([]);
      setIsExpanded(false);
      setFormatting({ bold: false, italic: false, list: false });
      onPostCreated?.();
    }
  };

  const resetForm = () => {
    setIsExpanded(false);
    setContent('');
    setCategory('');
    setAttachments([]);
    setFormatting({ bold: false, italic: false, list: false });
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {!isExpanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left px-4 py-3 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Share something with the community...
              </button>
            ) : (
              <>
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
                  <Toggle
                    size="sm"
                    pressed={formatting.bold}
                    onPressedChange={() => applyFormatting('bold')}
                    aria-label="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={formatting.italic}
                    onPressedChange={() => applyFormatting('italic')}
                    aria-label="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={formatting.list}
                    onPressedChange={() => applyFormatting('list')}
                    aria-label="List"
                  >
                    <List className="h-4 w-4" />
                  </Toggle>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Toggle
                    size="sm"
                    aria-label="Add link"
                    onPressedChange={() => {
                      const url = prompt('Enter URL:');
                      if (url) {
                        setContent(prev => prev + ` [link](${url})`);
                      }
                    }}
                  >
                    <Link2 className="h-4 w-4" />
                  </Toggle>
                </div>

                <Textarea
                  placeholder="Share a clinical insight, research finding, or start a discussion..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                  autoFocus
                />

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment, idx) => (
                      <div key={idx} className="relative group">
                        {attachment.type === 'image' && attachment.preview ? (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                            <img 
                              src={attachment.preview} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeAttachment(idx)}
                              className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[120px]">
                              {attachment.file.name}
                            </span>
                            <button
                              onClick={() => removeAttachment(idx)}
                              className="p-0.5 hover:bg-muted rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Hidden file inputs */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {cat.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Image className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-accent hover:bg-accent/90"
                      disabled={!content.trim() || !category || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
