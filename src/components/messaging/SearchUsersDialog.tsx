
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat: (userIds: string[], title?: string) => Promise<string | void>;
}

interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  city?: string;
  country?: string;
}

export const SearchUsersDialog: React.FC<SearchUsersDialogProps> = ({
  open,
  onOpenChange,
  onStartChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use actual columns from your profiles table
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, username, full_name, avatar_url, city, country')
        .or(`email.ilike.%${query}%,username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      setSearchResults(users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error searching users",
        description: "Could not search for users",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleStartChat = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Select users",
        description: "Please select at least one user to start a chat",
        variant: "destructive",
      });
      return;
    }

    try {
      const userIds = selectedUsers.map(user => user.id);
      await onStartChat(userIds);
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
      onOpenChange(false);
      
      toast({
        title: "Chat created",
        description: "New conversation started successfully",
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error creating chat",
        description: "Could not create new conversation",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = (user: User) => {
    return user.full_name || user.username || user.email.split('@')[0];
  };

  const getUserLocation = (user: User) => {
    if (user.city && user.country) return `${user.city}, ${user.country}`;
    if (user.city) return user.city;
    if (user.country) return user.country;
    return null;
  };

  const getUserInitials = (user: User) => {
    const name = getUserDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Users:</label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <Badge key={user.id} variant="secondary" className="px-3 py-1 text-sm">
                    {getUserDisplayName(user)}
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <ScrollArea className="h-48 border rounded-md">
              <div className="p-2 space-y-2">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleUserSelect(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getUserDisplayName(user)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">@{user.username || user.email.split('@')[0]}</span>
                        {getUserLocation(user) && (
                          <>
                            <span>•</span>
                            <span className="truncate">{getUserLocation(user)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {isSearching && (
            <p className="text-sm text-muted-foreground text-center">Searching users...</p>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No users found</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartChat}
              disabled={selectedUsers.length === 0}
              className="flex-1"
            >
              Start Chat ({selectedUsers.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};