import { Crown, Shield, Sword, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROLE_CONFIG = {
  infernal_priest: {
    label: "Infernal Priest",
    icon: Crown,
    className: "bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary",
  },
  infernal_priestess: {
    label: "Infernal Priestess",
    icon: Crown,
    className: "bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary",
  },
  knight: {
    label: "Knight",
    icon: Sword,
    className: "bg-secondary text-secondary-foreground border-secondary",
  },
  duke: {
    label: "Duke",
    icon: Shield,
    className: "bg-muted text-muted-foreground border-border",
  },
  duchess: {
    label: "Duchess",
    icon: Shield,
    className: "bg-muted text-muted-foreground border-border",
  },
  admin: {
    label: "Admin",
    icon: Star,
    className: "bg-primary/20 text-primary border-primary",
  },
  member: {
    label: "Member",
    icon: Users,
    className: "bg-card text-card-foreground border-border",
  },
};

interface RoleBadgeProps {
  role: string;
  size?: "sm" | "md" | "lg";
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.member;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Badge className={`${config.className} ${sizeClasses[size]} flex items-center gap-1.5 font-semibold`}>
      <Icon className={iconSizes[size]} />
      {config.label}
    </Badge>
  );
}
