import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, BookOpen, Target, Clock, Send, Loader2 } from 'lucide-react';

export default function Study() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'qa' | 'practice'>('qa');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setAnswer('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: mode,
          question: question.trim(),
          userRole: profile?.medical_role || 'medical_student',
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                setAnswer(fullResponse);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to get AI response', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Study Engine</h1>
            <p className="text-muted-foreground">Powered by advanced medical AI</p>
          </div>
          <div className="flex gap-2">
            <Button variant={mode === 'qa' ? 'default' : 'outline'} onClick={() => setMode('qa')} className={mode === 'qa' ? 'bg-accent' : ''}>
              <Brain className="h-4 w-4 mr-2" /> Q&A
            </Button>
            <Button variant={mode === 'practice' ? 'default' : 'outline'} onClick={() => setMode('practice')} className={mode === 'practice' ? 'bg-accent' : ''}>
              <Target className="h-4 w-4 mr-2" /> Practice
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {mode === 'qa' ? <><BookOpen className="h-5 w-5" /> Ask a Medical Question</> : <><Target className="h-5 w-5" /> Generate Practice Question</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={mode === 'qa' ? "Ask any medical question..." : "Enter a topic (e.g., 'cardiology pharmacology')..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAskQuestion} disabled={isLoading || !question.trim()} className="bg-accent hover:bg-accent/90">
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Thinking...</> : <><Send className="h-4 w-4 mr-2" /> {mode === 'qa' ? 'Ask' : 'Generate'}</>}
            </Button>

            {answer && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <Badge className="mb-3">AI Response</Badge>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{answer}</div>
                <p className="mt-4 text-xs text-muted-foreground">⚠️ This is for educational purposes only. Always verify with authoritative sources.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
