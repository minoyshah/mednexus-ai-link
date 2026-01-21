import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Edit2, Save, Loader2, Heart, FlaskConical } from 'lucide-react';

interface InterestsEditorProps {
  userId: string;
  clinicalInterests: string[];
  researchInterests: string[];
  onUpdate: () => void;
}

export default function InterestsEditor({
  userId,
  clinicalInterests,
  researchInterests,
  onUpdate,
}: InterestsEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clinical, setClinical] = useState<string[]>(clinicalInterests);
  const [research, setResearch] = useState<string[]>(researchInterests);
  const [newClinical, setNewClinical] = useState('');
  const [newResearch, setNewResearch] = useState('');

  const handleAddClinical = () => {
    if (newClinical.trim() && !clinical.includes(newClinical.trim())) {
      setClinical([...clinical, newClinical.trim()]);
      setNewClinical('');
    }
  };

  const handleAddResearch = () => {
    if (newResearch.trim() && !research.includes(newResearch.trim())) {
      setResearch([...research, newResearch.trim()]);
      setNewResearch('');
    }
  };

  const handleRemoveClinical = (interest: string) => {
    setClinical(clinical.filter((i) => i !== interest));
  };

  const handleRemoveResearch = (interest: string) => {
    setResearch(research.filter((i) => i !== interest));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        clinical_interests: clinical.length > 0 ? clinical : null,
        research_interests: research.length > 0 ? research : null,
      })
      .eq('user_id', userId);

    setIsSaving(false);

    if (error) {
      toast({ title: 'Failed to save interests', variant: 'destructive' });
    } else {
      toast({ title: 'Interests updated' });
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleCancel = () => {
    setClinical(clinicalInterests);
    setResearch(researchInterests);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Interests</CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Clinical Interests */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" /> Clinical Interests
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {clinical.length === 0 && !isEditing && (
              <p className="text-sm text-muted-foreground">No clinical interests added</p>
            )}
            {clinical.map((interest) => (
              <Badge key={interest} variant="secondary" className="gap-1">
                {interest}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveClinical(interest)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                placeholder="Add clinical interest..."
                value={newClinical}
                onChange={(e) => setNewClinical(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddClinical())}
                className="max-w-xs"
              />
              <Button variant="outline" size="icon" onClick={handleAddClinical}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Research Interests */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-accent" /> Research Interests
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {research.length === 0 && !isEditing && (
              <p className="text-sm text-muted-foreground">No research interests added</p>
            )}
            {research.map((interest) => (
              <Badge key={interest} variant="outline" className="gap-1">
                {interest}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveResearch(interest)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                placeholder="Add research interest..."
                value={newResearch}
                onChange={(e) => setNewResearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResearch())}
                className="max-w-xs"
              />
              <Button variant="outline" size="icon" onClick={handleAddResearch}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
