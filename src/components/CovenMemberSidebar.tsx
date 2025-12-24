import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoleBadge } from "./RoleBadge";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

interface CovenMemberSidebarProps {
  covenName: string;
  covenDescription: string;
  members: any[];
}

export function CovenMemberSidebar({ covenName, covenDescription, members }: CovenMemberSidebarProps) {
  return (
    <div className="w-80 border-l border-border bg-card p-6 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">{covenName}</h3>
        <p className="text-sm text-muted-foreground mb-4">{covenDescription}</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm font-semibold">{members.length} members</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <h4 className="text-lg font-semibold mb-3 text-foreground">Members</h4>
        <ScrollArea className="h-full pr-4">
          <div className="space-y-3">
            {members.map((member) => (
              <Link
                key={member.id}
                to={`/profile/${member.user_id}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={member.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {member.profiles?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {member.profiles?.username || "Unknown"}
                  </p>
                  <div className="mt-1">
                    <RoleBadge role={member.role} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
