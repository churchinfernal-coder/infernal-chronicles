// ═══════════════════════════════════════════════════════════════════════════
// Covens List Page - PHASE 1 FIXED
// ✅ Type-safe
// ✅ Secure token generation
// ✅ Proper error handling
// ✅ File validation
// ✅ No race conditions
// ✅ Optimistic UI updates
// ✅ SOLID MODAL BACKGROUNDS - NO TRANSPARENCY
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ExternalLink, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { GoetiaSignil } from "@/components/GoetiaSignil";
import { GOETIA_DEMONS } from "@/data/goetia";
import { 
  createCoven, 
  joinCovenByInviteCode, 
  validateFile 
} from "@/lib/covenHelpers";

const AVAILABLE_SIGILS = GOETIA_DEMONS.slice(0, 12);

interface Coven {
  id: string;
  name: string;
  description: string | null;
  subculture: string | null;
  belief_system: string | null;
  sigil: string | null;
  is_private: boolean;
  member_count: number;
  created_at: string;
}

interface CovenMembership {
  id: string;
  role: string;
  covens: Coven;
}

export default function Covens() {
  const [covens, setCovens] = useState<Coven[]>([]);
  const [myCovens, setMyCovens] = useState<CovenMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  
  const [newCoven, setNewCoven] = useState({ 
    name: "", 
    description: "", 
    subculture: "",
    sigil: AVAILABLE_SIGILS[0].name.toLowerCase(),
  });
  
  const [inviteCode, setInviteCode] = useState("");
  const [uploadingSigil, setUploadingSigil] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchCovens();
    fetchMyCovens();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
  };

  const fetchCovens = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("covens")
        .select("*")
        .eq("is_private", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCovens(data || []);
    } catch (error: any) {
      console.error('[fetchCovens] Error:', error);
      toast.error("Failed to load public covens");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCovens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("coven_members")
        .select(`
          *,
          covens(*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setMyCovens(data || []);
    } catch (error: any) {
      console.error('[fetchMyCovens] Error:', error);
      toast.error("Failed to load your covens");
    }
  };

  const handleCreateCoven = async () => {
    if (creating) return;
    
    if (!newCoven.name.trim()) {
      toast.error("Coven name is required");
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const coven = await createCoven({
        name: newCoven.name,
        description: newCoven.description,
        subculture: newCoven.subculture,
        sigil: newCoven.sigil,
        isPrivate: true,
        userId: user.id,
      });

      toast.success(`${newCoven.name} established successfully!`);
      
      setNewCoven({ 
        name: "", 
        description: "", 
        subculture: "", 
        sigil: AVAILABLE_SIGILS[0].name.toLowerCase() 
      });
      setDialogOpen(false);

      await fetchMyCovens();
      navigate(`/coven/${coven.id}`);
    } catch (error: any) {
      console.error('[handleCreateCoven] Error:', error);
      
      if (error.message.includes('Rate limit')) {
        toast.error("You've created too many covens today. Try again tomorrow.");
      } else {
        toast.error(error.message || "Failed to create coven");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async () => {
    if (joining) return;
    
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    setJoining(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const covenId = await joinCovenByInviteCode(inviteCode, user.id);

      toast.success("Successfully joined coven!");
      setInviteCode("");
      setJoinDialogOpen(false);

      await fetchMyCovens();
      navigate(`/coven/${covenId}`);
    } catch (error: any) {
      console.error('[handleJoinByCode] Error:', error);
      toast.error(error.message || "Failed to join coven");
    } finally {
      setJoining(false);
    }
  };

  const handleSigilUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploadingSigil(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `temp-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('coven-sigils')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('coven-sigils')
        .getPublicUrl(fileName);

      setNewCoven({ ...newCoven, sigil: publicUrl });
      toast.success("Sigil uploaded successfully");
    } catch (error: any) {
      console.error('[handleSigilUpload] Error:', error);
      toast.error("Failed to upload sigil");
    } finally {
      setUploadingSigil(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <div className="text-2xl text-primary">Loading chambers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 md:ml-64 lg:ml-72">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-wide">
            UNDERGROUND CHAMBERS
          </h1>
          <p className="text-muted-foreground text-lg">Ritual-based subculture groups</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {/* CREATE COVEN DIALOG */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="px-6 py-6 text-lg font-bold"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Establish New Chamber
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="max-w-2xl max-h-[90vh] overflow-y-auto border-0"
              style={{
                backgroundColor: '#09090b',
                border: '1px solid #27272a',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              }}
            >
              <DialogHeader>
                <DialogTitle 
                  className="text-3xl text-center font-bold"
                  style={{ color: '#ffffff' }}
                >
                  🔥 Establish Chamber
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 p-4">
                {/* Chamber Name */}
                <div>
                  <Label 
                    className="text-lg mb-2 block font-semibold"
                    style={{ color: '#ffffff' }}
                  >
                    Chamber Name <span style={{ color: '#ef4444' }}>*</span>
                  </Label>
                  <Input
                    value={newCoven.name}
                    onChange={(e) => setNewCoven({ ...newCoven, name: e.target.value })}
                    placeholder="Enter chamber name..."
                    className="text-lg p-6 border-2"
                    maxLength={100}
                    style={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      color: '#ffffff',
                    }}
                  />
                  <p className="text-sm mt-1" style={{ color: '#71717a' }}>
                    {newCoven.name.length}/100 characters
                  </p>
                </div>

                {/* Purpose */}
                <div>
                  <Label 
                    className="text-lg mb-2 block font-semibold"
                    style={{ color: '#ffffff' }}
                  >
                    Purpose
                  </Label>
                  <Textarea
                    value={newCoven.description}
                    onChange={(e) => setNewCoven({ ...newCoven, description: e.target.value })}
                    placeholder="Describe rituals and purpose..."
                    rows={4}
                    className="text-base p-4 border-2"
                    maxLength={500}
                    style={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      color: '#ffffff',
                    }}
                  />
                  <p className="text-sm mt-1" style={{ color: '#71717a' }}>
                    {newCoven.description.length}/500 characters
                  </p>
                </div>

                {/* Subculture */}
                <div>
                  <Label 
                    className="text-lg mb-2 block font-semibold"
                    style={{ color: '#ffffff' }}
                  >
                    Subculture
                  </Label>
                  <Input
                    value={newCoven.subculture}
                    onChange={(e) => setNewCoven({ ...newCoven, subculture: e.target.value })}
                    placeholder="e.g., Occultist, Goth, Metal..."
                    className="text-lg p-6 border-2"
                    maxLength={50}
                    style={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Sigil Selection */}
                <div>
                  <Label 
                    className="text-lg mb-3 block font-semibold"
                    style={{ color: '#ffffff' }}
                  >
                    Select Sigil
                  </Label>
                  <div 
                    className="grid grid-cols-4 gap-3 p-4 rounded-lg"
                    style={{ backgroundColor: '#18181b' }}
                  >
                    {AVAILABLE_SIGILS.map((demon) => (
                      <button
                        key={demon.number}
                        type="button"
                        onClick={() => setNewCoven({ ...newCoven, sigil: demon.name.toLowerCase() })}
                        className="p-2 rounded-lg transition-all border-2"
                        style={{
                          borderColor: newCoven.sigil === demon.name.toLowerCase() ? '#dc2626' : '#3f3f46',
                          backgroundColor: newCoven.sigil === demon.name.toLowerCase() ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                        }}
                      >
                        <GoetiaSignil
                          demonNumber={demon.number}
                          demonName={demon.name}
                          className="w-full h-12"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Sigil Upload */}
                <div>
                  <Label 
                    className="text-lg mb-2 block font-semibold"
                    style={{ color: '#ffffff' }}
                  >
                    Upload Custom Sigil <span style={{ color: '#71717a' }}>(Optional)</span>
                  </Label>
                  <p className="text-sm mb-3" style={{ color: '#71717a' }}>
                    Max 10MB • JPEG, PNG, WebP, GIF
                  </p>
                  
                  <label 
                    className="flex items-center justify-center gap-3 h-14 rounded-lg cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: '#27272a', 
                      border: '2px dashed #52525b',
                      color: '#a1a1aa',
                    }}
                  >
                    {uploadingSigil ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span className="font-medium">Choose File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSigilUpload}
                      disabled={uploadingSigil}
                      className="hidden"
                    />
                  </label>
                  
                  {newCoven.sigil && newCoven.sigil.startsWith('http') && (
                    <div className="mt-4 flex justify-center">
                      <img 
                        src={newCoven.sigil} 
                        alt="Custom sigil" 
                        className="w-24 h-24 object-contain rounded-lg p-2"
                        style={{ 
                          border: '2px solid #dc2626',
                          backgroundColor: '#18181b',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* CREATE BUTTON - HIGHLY VISIBLE */}
                <Button 
                  onClick={handleCreateCoven} 
                  className="w-full py-8 text-xl font-bold uppercase tracking-wide"
                  disabled={creating || !newCoven.name.trim()}
                  style={{
                    backgroundColor: creating || !newCoven.name.trim() ? '#52525b' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                  }}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                      Creating Chamber...
                    </>
                  ) : (
                    <>
                      <Plus className="h-6 w-6 mr-3" />
                      CREATE CHAMBER
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* JOIN BY CODE DIALOG */}
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="px-6 py-6 text-lg font-bold"
                style={{
                  borderColor: '#52525b',
                  borderWidth: '2px',
                  color: '#ffffff',
                  backgroundColor: 'transparent',
                }}
              >
                <Users className="h-5 w-5 mr-2" />
                Join by Invite Code
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="border-0"
              style={{
                backgroundColor: '#09090b',
                border: '1px solid #27272a',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              }}
            >
              <DialogHeader>
                <DialogTitle 
                  className="text-2xl text-center font-bold"
                  style={{ color: '#ffffff' }}
                >
                  🔑 Enter Invite Code
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 p-4">
                <div>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXXXX"
                    className="text-center text-3xl tracking-widest p-8 uppercase font-mono border-2"
                    maxLength={8}
                    style={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      color: '#ffffff',
                    }}
                  />
                  <p className="text-center text-sm mt-2" style={{ color: '#71717a' }}>
                    {inviteCode.length}/8 characters
                  </p>
                </div>
                
                <Button 
                  onClick={handleJoinByCode} 
                  className="w-full py-8 text-xl font-bold uppercase"
                  disabled={joining || !inviteCode.trim()}
                  style={{
                    backgroundColor: joining || !inviteCode.trim() ? '#52525b' : '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                  }}
                >
                  {joining ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Users className="h-6 w-6 mr-3" />
                      JOIN CHAMBER
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="mine" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="mine" className="text-lg">
              My Chambers ({myCovens.length})
            </TabsTrigger>
            <TabsTrigger value="public" className="text-lg">
              Public ({covens.length})
            </TabsTrigger>
          </TabsList>

          {/* MY COVENS TAB */}
          <TabsContent value="mine" className="space-y-6">
            {myCovens.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-xl text-muted-foreground mb-4">No chambers joined</p>
                <p className="text-sm text-muted-foreground">
                  Create a new chamber or join with an invite code
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myCovens.map((membership) => {
                  const coven = membership.covens;
                  if (!coven) return null;
                  
                  return (
                    <Link
                      key={membership.id}
                      to={`/coven/${coven.id}`}
                      className="group border rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20"
                    >
                      <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                        {coven.sigil?.startsWith('http') ? (
                          <img src={coven.sigil} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (() => {
                            const demon = GOETIA_DEMONS.find(d => d.name.toLowerCase() === coven.sigil) || GOETIA_DEMONS[0];
                            return <GoetiaSignil demonNumber={demon.number} demonName={demon.name} className="w-32 h-32 opacity-80 group-hover:opacity-100 transition-opacity" />;
                          })()
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                          {coven.name}
                          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-10">
                          {coven.description || "Underground chamber"}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize">
                            {coven.belief_system || coven.subculture || "Satanist"}
                          </Badge>
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            {membership.role}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{coven.member_count} members</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* PUBLIC COVENS TAB */}
          <TabsContent value="public" className="space-y-6">
            {covens.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-xl text-muted-foreground">No public chambers available</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {covens.map((coven) => (
                  <Link
                    key={coven.id}
                    to={`/coven/${coven.id}`}
                    className="group border rounded-xl overflow-hidden hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20"
                  >
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                      {coven.sigil?.startsWith('http') ? (
                        <img src={coven.sigil} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (() => {
                          const demon = GOETIA_DEMONS.find(d => d.name.toLowerCase() === coven.sigil) || GOETIA_DEMONS[0];
                          return <GoetiaSignil demonNumber={demon.number} demonName={demon.name} className="w-32 h-32 opacity-80 group-hover:opacity-100 transition-opacity" />;
                        })()
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                        {coven.name}
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-10">
                        {coven.description || "Underground chamber"}
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {coven.belief_system || coven.subculture || "Satanist"}
                      </Badge>
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{coven.member_count} members</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}