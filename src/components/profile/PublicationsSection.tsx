import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Edit2, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Publication {
  id: string;
  title: string;
  journal: string | null;
  authors: string[] | null;
  publication_date: string | null;
  doi: string | null;
  pubmed_id: string | null;
  url: string | null;
}

interface PublicationsSectionProps {
  userId: string;
}

export default function PublicationsSection({ userId }: PublicationsSectionProps) {
  const { toast } = useToast();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Publication | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    journal: '',
    authors: '',
    publication_date: '',
    doi: '',
    pubmed_id: '',
    url: '',
  });

  const fetchPublications = async () => {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('user_id', userId)
      .order('publication_date', { ascending: false });

    if (data) setPublications(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPublications();
  }, [userId]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({ title: '', journal: '', authors: '', publication_date: '', doi: '', pubmed_id: '', url: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (pub: Publication) => {
    setEditingItem(pub);
    setFormData({
      title: pub.title,
      journal: pub.journal || '',
      authors: pub.authors?.join(', ') || '',
      publication_date: pub.publication_date || '',
      doi: pub.doi || '',
      pubmed_id: pub.pubmed_id || '',
      url: pub.url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const dataToSave = {
        user_id: userId,
        title: formData.title,
        journal: formData.journal || null,
        authors: formData.authors ? formData.authors.split(',').map((a) => a.trim()) : null,
        publication_date: formData.publication_date || null,
        doi: formData.doi || null,
        pubmed_id: formData.pubmed_id || null,
        url: formData.url || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('publications')
          .update(dataToSave)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: 'Publication updated' });
      } else {
        const { error } = await supabase
          .from('publications')
          .insert(dataToSave);
        if (error) throw error;
        toast({ title: 'Publication added' });
      }

      setIsDialogOpen(false);
      fetchPublications();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('publications').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Publication deleted' });
      fetchPublications();
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (isLoading) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Publications
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {publications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No publications added yet.</p>
          ) : (
            <div className="space-y-4">
              {publications.map((pub) => (
                <div key={pub.id} className="group flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h4 className="font-medium">{pub.title}</h4>
                      {pub.url && (
                        <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {pub.journal && <p className="text-sm text-muted-foreground">{pub.journal}</p>}
                    {pub.authors && <p className="text-sm text-muted-foreground">{pub.authors.join(', ')}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {pub.publication_date && <span className="text-xs text-muted-foreground">{formatDate(pub.publication_date)}</span>}
                      {pub.doi && <Badge variant="outline" className="text-xs">DOI: {pub.doi}</Badge>}
                      {pub.pubmed_id && <Badge variant="outline" className="text-xs">PMID: {pub.pubmed_id}</Badge>}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(pub)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Publication?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(pub.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Add'} Publication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal">Journal</Label>
              <Input id="journal" value={formData.journal} onChange={(e) => setFormData({ ...formData, journal: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authors">Authors (comma-separated)</Label>
              <Input id="authors" value={formData.authors} onChange={(e) => setFormData({ ...formData, authors: e.target.value })} placeholder="Smith J, Doe A, ..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publication_date">Publication Date</Label>
                <Input id="publication_date" type="date" value={formData.publication_date} onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doi">DOI</Label>
                <Input id="doi" value={formData.doi} onChange={(e) => setFormData({ ...formData, doi: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pubmed_id">PubMed ID</Label>
                <Input id="pubmed_id" value={formData.pubmed_id} onChange={(e) => setFormData({ ...formData, pubmed_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
