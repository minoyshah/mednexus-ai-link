import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Shield, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Profile {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  primary_specialty: string | null;
  medical_role: string | null;
  institution: string | null;
}

export default function PeopleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProfiles = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const searchTerm = `%${query.trim()}%`;

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, headline, avatar_url, primary_specialty, medical_role, institution')
        .or(`full_name.ilike.${searchTerm},primary_specialty.ilike.${searchTerm},institution.ilike.${searchTerm},medical_role.ilike.${searchTerm}`)
        .limit(6);

      if (!error && data) {
        setResults(data as Profile[]);
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search people by name, specialty, institution..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-accent"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && query.trim().length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No people found for "{query}"
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((profile) => (
                  <Link
                    key={profile.user_id}
                    to={`/app/profile/${profile.user_id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {profile.full_name || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.headline || profile.primary_specialty || profile.medical_role || 'Medical Professional'}
                      </p>
                      {profile.institution && (
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {profile.institution}
                        </p>
                      )}
                    </div>
                    {profile.primary_specialty && (
                      <Badge variant="secondary" className="text-xs hidden sm:flex">
                        {profile.primary_specialty}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
