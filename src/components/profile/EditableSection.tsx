import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'checkbox';
  required?: boolean;
}

interface EditableSectionProps<T> {
  title: string;
  icon: React.ReactNode;
  items: T[];
  userId: string;
  tableName: string;
  fields: FieldConfig[];
  renderItem: (item: T) => React.ReactNode;
  onRefresh: () => void;
  emptyMessage?: string;
}

export default function EditableSection<T extends { id: string }>({
  title,
  icon,
  items,
  userId,
  tableName,
  fields,
  renderItem,
  onRefresh,
  emptyMessage = 'No items added yet.',
}: EditableSectionProps<T>) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: T) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validate required fields
    for (const field of fields) {
      if (field.required && !formData[field.name]) {
        toast({ title: `${field.label} is required`, variant: 'destructive' });
        return;
      }
    }

    setIsSaving(true);

    try {
      const dataToSave: Record<string, any> = { ...formData, user_id: userId };
      if ('id' in dataToSave) delete dataToSave.id;

      if (editingItem) {
        const { error } = await supabase
          .from(tableName as 'education' | 'experience' | 'certifications')
          .update(dataToSave as any)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: `${title.slice(0, -1)} updated` });
      } else {
        const { error } = await supabase
          .from(tableName as 'education' | 'experience' | 'certifications')
          .insert(dataToSave as any);
        if (error) throw error;
        toast({ title: `${title.slice(0, -1)} added` });
      }

      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from(tableName as 'education' | 'experience' | 'certifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: `${title.slice(0, -1)} deleted` });
      onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon} {title}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{emptyMessage}</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="group flex items-start gap-4">
                  <div className="flex-1">{renderItem(item)}</div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
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
                          <AlertDialogTitle>Delete {title.slice(0, -1)}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Add'} {title.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                {field.type === 'checkbox' ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={formData[field.name] || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, [field.name]: checked })}
                    />
                    <Label htmlFor={field.name}>{field.label}</Label>
                  </div>
                ) : (
                  <>
                    <Label htmlFor={field.name}>{field.label}{field.required && ' *'}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
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
