import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, Moon, Flame, Users, Plus, Eye, Skull, Zap } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const ritualTypes = [
  { value: "ritual", label: "Dark Ritual", icon: Skull, color: "text-purple-400", bg: "bg-purple-950/20" },
  { value: "summoning", label: "Summoning", icon: Flame, color: "text-red-400", bg: "bg-red-950/20" },
  { value: "gathering", label: "Coven Gathering", icon: Users, color: "text-blue-400", bg: "bg-blue-950/20" },
];

const getMoonPhase = (date: Date) => {
  const lunarCycle = 29.53058867;
  const knownNewMoon = new Date("2000-01-06"). getTime();
  const daysSince = (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = (daysSince % lunarCycle) / lunarCycle;
  
  if (phase < 0.125) return { name: "New Moon", emoji: "🌑", glyph: "●" };
  if (phase < 0.25) return { name: "Waxing Crescent", emoji: "🌒", glyph: "◐" };
  if (phase < 0.375) return { name: "First Quarter", emoji: "🌓", glyph: "◑" };
  if (phase < 0.5) return { name: "Waxing Gibbous", emoji: "🌔", glyph: "◕" };
  if (phase < 0.625) return { name: "Full Moon", emoji: "🌕", glyph: "○" };
  if (phase < 0.75) return { name: "Waning Gibbous", emoji: "🌖", glyph: "◔" };
  if (phase < 0.875) return { name: "Last Quarter", emoji: "🌗", glyph: "◒" };
  return { name: "Waning Crescent", emoji: "🌘", glyph: "◓" };
};

export default function RitualCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rituals, setRituals] = useState<any[]>([]);
  const [covens, setCovens] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newRitual, setNewRitual] = useState({
    title: "",
    description: "",
    ritual_type: "ritual",
    scheduled_date: new Date(),
    location: "",
    is_public: false,
    coven_id: null as string | null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchRituals();
    fetchCovens();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth. getUser();
    if (!user) navigate("/auth");
  };

  const fetchRituals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from("rituals")
      .select("*")
      .order("scheduled_date", { ascending: true });

    if (error) toast.error(error.message);
    else setRituals(data || []);
    setLoading(false);
  };

  const fetchCovens = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from("coven_members")
      .select("covens(*)")
      .eq("user_id", user.id);

    if (error) toast.error(error.message);
    else setCovens(data?. map((m: any) => m.covens). filter(Boolean) || []);
  };

  const createRitual = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any). from("rituals").insert({
      ... newRitual,
      user_id: user.id,
      scheduled_date: newRitual.scheduled_date.toISOString(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Ritual scheduled in the shadows");
    setDialogOpen(false);
    setNewRitual({
      title: "",
      description: "",
      ritual_type: "ritual",
      scheduled_date: new Date(),
      location: "",
      is_public: false,
      coven_id: null,
    });
    fetchRituals();
  };

  const selectedRituals = rituals.filter(r => 
    isSameDay(new Date(r.scheduled_date), selectedDate)
  );

  const moonPhase = getMoonPhase(selectedDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 md:ml-64 lg:ml-72">
      <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif mb-2 flex items-center gap-3">
              <Moon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Ritual Calendar
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Plan your dark ceremonies under the celestial gaze</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Ritual
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/30 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-serif flex items-center gap-2">
                  <Flame className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  Schedule Dark Ceremony
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newRitual.title}
                    onChange={(e) => setNewRitual({ ...newRitual, title: e.target.value })}
                    placeholder="The Midnight Summoning..."
                    className="border-primary/30"
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <div className="grid grid-cols-3 gap-2 md:gap-3 mt-2">
                    {ritualTypes.map((type) => {
                      const Icon = type. icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setNewRitual({ ...newRitual, ritual_type: type.value })}
                          className={`p-2 md:p-3 rounded-lg border-2 transition-all ${
                            newRitual.ritual_type === type.value
                              ? `border-primary ${type.bg}`
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Icon className={`h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 ${type.color}`} />
                          <div className="text-xs font-medium">{type.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={format(newRitual.scheduled_date, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setNewRitual({ ...newRitual, scheduled_date: new Date(e.target.value) })}
                    className="border-primary/30"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newRitual.description}
                    onChange={(e) => setNewRitual({ ...newRitual, description: e.target.value })}
                    placeholder="Describe the ceremony..."
                    rows={3}
                    className="border-primary/30"
                  />
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    value={newRitual.location}
                    onChange={(e) => setNewRitual({ ...newRitual, location: e.target.value })}
                    placeholder="The old cathedral..."
                    className="border-primary/30"
                  />
                </div>

                {covens.length > 0 && (
                  <div>
                    <Label>Coven (Optional)</Label>
                    <Select
                      value={newRitual. coven_id || "none"}
                      onValueChange={(value) => setNewRitual({ ...newRitual, coven_id: value === "none" ? null : value })}
                    >
                      <SelectTrigger className="border-primary/30">
                        <SelectValue placeholder="Select a coven" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Coven</SelectItem>
                        {covens.map((coven) => (
                          <SelectItem key={coven. id} value={coven.id}>
                            {coven. name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <div>
                      <div className="text-sm md:text-base font-medium">Public Ritual</div>
                      <div className="text-xs md:text-sm text-muted-foreground">Visible to all</div>
                    </div>
                  </div>
                  <Switch
                    checked={newRitual. is_public}
                    onCheckedChange={(checked) => setNewRitual({ ...newRitual, is_public: checked })}
                  />
                </div>

                <Button onClick={createRitual} className="w-full bg-primary hover:bg-primary/90">
                  <Flame className="mr-2 h-4 w-4" />
                  Schedule Ritual
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Sacred Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className={cn("rounded-md border border-primary/20 pointer-events-auto w-full")}
                modifiers={{
                  hasRitual: rituals.map(r => new Date(r.scheduled_date))
                }}
                modifiersClassNames={{
                  hasRitual: "bg-primary/20 text-primary font-bold"
                }}
              />
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Moon Phase */}
            <Card className="border-primary/30 bg-linear-to-br from-card to-primary/5">
              <CardHeader>
                <CardTitle className="text-center text-lg md:text-xl">Lunar Phase</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-5xl md:text-6xl mb-3">{moonPhase.emoji}</div>
                <div className="text-2xl md:text-3xl font-serif mb-2">{moonPhase. glyph}</div>
                <div className="font-medium text-base md:text-lg">{moonPhase.name}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-2">
                  {format(selectedDate, "MMMM d, yyyy")}
                </div>
              </CardContent>
            </Card>

            {/* Selected Date Rituals */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-sm md:text-base">Rituals on {format(selectedDate, "MMM d")}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRituals.length === 0 ? (
                  <p className="text-xs md:text-sm text-muted-foreground text-center py-4">
                    No rituals scheduled
                  </p>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {selectedRituals.map((ritual) => {
                      const type = ritualTypes.find(t => t.value === ritual.ritual_type);
                      const Icon = type?. icon || Skull;
                      return (
                        <div
                          key={ritual.id}
                          className={`p-2 md:p-3 rounded-lg border ${type?.bg} border-primary/30`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className={`h-4 w-4 md:h-5 md:w-5 mt-0.5 ${type?. color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm md:text-base font-medium truncate">{ritual.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(ritual.scheduled_date), "h:mm a")}
                              </div>
                              {ritual.location && (
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                  📍 {ritual.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Rituals List */}
        <Card className="mt-4 md:mt-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Upcoming Ceremonies</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4 w-full grid grid-cols-2">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="all">All Rituals</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-3">
                {rituals
                  .filter(r => new Date(r.scheduled_date) >= new Date())
                  .slice(0, 5)
                  .map((ritual) => {
                    const type = ritualTypes.find(t => t. value === ritual.ritual_type);
                    const Icon = type?. icon || Skull;
                    return (
                      <div
                        key={ritual.id}
                        className={`p-3 md:p-4 rounded-lg border-2 border-primary/20 ${type?.bg} hover:border-primary/50 transition-all`}
                      >
                        <div className="flex items-start gap-2 md:gap-3">
                          <Icon className={`h-5 w-5 md:h-6 md:w-6 mt-1 ${type?.color} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base md:text-lg">{ritual.title}</div>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              {format(new Date(ritual.scheduled_date), "EEEE, MMMM d 'at' h:mm a")}
                            </div>
                            {ritual.description && (
                              <p className="text-xs md:text-sm mt-2 line-clamp-2">{ritual.description}</p>
                            )}
                            {ritual.location && (
                              <div className="text-xs md:text-sm text-muted-foreground mt-2 truncate">
                                📍 {ritual.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {rituals.filter(r => new Date(r. scheduled_date) >= new Date()). length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Skull className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm md:text-base">No upcoming rituals scheduled</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-3">
                {rituals.slice(0, 10).map((ritual) => {
                  const type = ritualTypes.find(t => t.value === ritual.ritual_type);
                  const Icon = type?.icon || Skull;
                  return (
                    <div
                      key={ritual.id}
                      className={`p-3 md:p-4 rounded-lg border-2 border-border ${type?.bg}`}
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        <Icon className={`h-5 w-5 md:h-6 md:w-6 mt-1 ${type?.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm md:text-base font-semibold truncate">{ritual. title}</div>
                          <div className="text-xs md:text-sm text-muted-foreground">
                            {format(new Date(ritual.scheduled_date), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}