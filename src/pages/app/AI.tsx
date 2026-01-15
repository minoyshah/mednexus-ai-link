import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, MessageSquare, BookOpen, Lightbulb, AlertTriangle, Loader2 } from 'lucide-react';

export default function AI() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'qa' | 'practice'>('qa');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || !user) return;
    setIsLoading(true);
    setAnswer('');

    try {
      const response = await supabase.functions.invoke('medical-ai', {
        body: { type: mode, question: question.trim() },
      });

      if (response.error) throw response.error;

      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                result += content;
                setAnswer(result);
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" /> AI Medical Assistant
          </h1>
          <p className="text-muted-foreground">Educational AI for medical learning</p>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">For educational purposes only. Not for clinical decisions.</p>
            </div>
          </CardContent>
        </Card>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'qa' | 'practice')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qa" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Q&A Mode
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-2">
              <BookOpen className="h-4 w-4" /> Practice Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qa" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ask a Medical Question</CardTitle>
                <CardDescription>Get educational explanations on medical topics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Ask about pathophysiology, pharmacology, clinical presentations..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSubmit} disabled={isLoading || !question.trim()} className="w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Thinking...' : 'Get Answer'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Practice Questions</CardTitle>
                <CardDescription>USMLE/board-style questions on any topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter a topic (e.g., 'heart failure management', 'Type 2 diabetes')"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleSubmit} disabled={isLoading || !question.trim()} className="w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Generating...' : 'Generate Question'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {answer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{answer}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
