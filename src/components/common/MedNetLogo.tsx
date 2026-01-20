import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedNetLogoProps {
  linkTo?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const SIZES = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-lg',
    tagline: 'text-[8px]',
  },
  md: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-xl',
    tagline: 'text-[10px]',
  },
  lg: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-2xl',
    tagline: 'text-xs',
  },
};

export default function MedNetLogo({ 
  linkTo = '/app/feed', 
  size = 'md', 
  showTagline = true,
  className 
}: MedNetLogoProps) {
  const s = SIZES[size];

  const content = (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <div className={cn("relative flex items-center justify-center", s.container)}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent via-trust to-accent opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300" />
        {/* Main icon container */}
        <div className="relative flex items-center justify-center w-full h-full rounded-xl bg-gradient-to-br from-accent to-trust shadow-lg">
          <ShieldCheck className={cn("text-white drop-shadow-md", s.icon)} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className={cn("font-bold bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent", s.text)}>
          MedNet
        </span>
        {showTagline && (
          <span className={cn("font-medium tracking-widest text-muted-foreground uppercase -mt-0.5", s.tagline)}>
            Verified Network
          </span>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
}
