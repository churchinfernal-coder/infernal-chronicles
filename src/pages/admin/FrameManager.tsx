import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Film, Plus, Save, FolderOpen, Download, Upload, 
  Settings, Clapperboard, Image as ImageIcon
} from "lucide-react";
import { FrameTimeline } from "@/components/admin/FrameTimeline";
import { FrameCanvas } from "@/components/admin/FrameCanvas";

interface Project {
  id: string;
  title: string;
  fps: number;
  resolution_width: number;
  resolution_height: number;
  status: string;
  created_at: string;
}

interface Frame {
  id: string;
  frame_number: number;
  image_url?: string;
  is_keyframe: boolean;
  duration_frames: number;
}

interface Layer {
  id: string;
  layer_name: string;
  layer_order: number;
  is_visible: boolean;
  is_locked: boolean;
  opacity: number;
  blend_mode: string;
}

export default function FrameManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOnionSkin, setShowOnionSkin] = useState(true);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState(30);
  const [loading, setLoading] = useState(false);
  
  // New Project Dialog
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectFps, setNewProjectFps] = useState(24);
  const [newProjectRes, setNewProjectRes] = useState("1920x1080");

  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (currentProject) {
      loadProjectData();
    }
  }, [currentProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('cinematic_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const loadProjectData = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      // Load frames
      const { data: framesData, error: framesError } = await supabase
        .from('cinematic_frames')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('frame_number');

      if (framesError) throw framesError;

      // Load layers
      const { data: layersData, error: layersError } = await supabase
        .from('cinematic_layers')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('layer_order');

      if (layersError) throw layersError;

      setFrames(framesData || []);
      setLayers(layersData || []);
      setCurrentFrame(0);
    } catch (error: any) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectTitle.trim()) {
      toast.error('Project title is required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [width, height] = newProjectRes.split('x').map(Number);

      const { data, error } = await supabase
        .from('cinematic_projects')
        .insert({
          user_id: user.id,
          title: newProjectTitle,
          fps: newProjectFps,
          resolution_width: width,
          resolution_height: height,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial frame
      await supabase
        .from('cinematic_frames')
        .insert({
          project_id: data.id,
          frame_number: 0,
          is_keyframe: true
        });

      // Create default layer
      await supabase
        .from('cinematic_layers')
        .insert({
          project_id: data.id,
          layer_name: 'Layer 1',
          layer_order: 0
        });

      toast.success('Project created successfully');
      setShowNewProject(false);
      setNewProjectTitle('');
      await loadProjects();
      setCurrentProject(data);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    }
  };

  const handlePlay = useCallback(() => {
    if (frames.length === 0 || !currentProject) return;

    setIsPlaying(true);
    let frame = currentFrame;

    playIntervalRef.current = setInterval(() => {
      frame = (frame + 1) % frames.length;
      setCurrentFrame(frame);
      
      if (frame === 0) {
        setIsPlaying(false);
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
        }
      }
    }, 1000 / currentProject.fps);
  }, [currentFrame, frames, currentProject]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  const handleAddFrame = async (afterFrame: number) => {
    if (!currentProject) return;

    try {
      const newFrameNumber = frames.length;

      const { error } = await supabase
        .from('cinematic_frames')
        .insert({
          project_id: currentProject.id,
          frame_number: newFrameNumber,
          is_keyframe: false
        });

      if (error) throw error;

      await loadProjectData();
      setCurrentFrame(newFrameNumber);
      toast.success('Frame added');
    } catch (error: any) {
      console.error('Error adding frame:', error);
      toast.error('Failed to add frame');
    }
  };

  const handleDeleteFrame = async (frameNum: number) => {
    if (!currentProject || frames.length <= 1) {
      toast.error('Cannot delete the last frame');
      return;
    }

    try {
      const frame = frames.find(f => f.frame_number === frameNum);
      if (!frame) return;

      await supabase
        .from('cinematic_frames')
        .delete()
        .eq('id', frame.id);

      await loadProjectData();
      setCurrentFrame(Math.max(0, currentFrame - 1));
      toast.success('Frame deleted');
    } catch (error: any) {
      console.error('Error deleting frame:', error);
      toast.error('Failed to delete frame');
    }
  };

  const handleToggleKeyframe = async (frameNum: number) => {
    const frame = frames.find(f => f.frame_number === frameNum);
    if (!frame) return;

    try {
      const { error } = await supabase
        .from('cinematic_frames')
        .update({ is_keyframe: !frame.is_keyframe })
        .eq('id', frame.id);

      if (error) throw error;

      await loadProjectData();
      toast.success(frame.is_keyframe ? 'Keyframe removed' : 'Keyframe added');
    } catch (error: any) {
      console.error('Error toggling keyframe:', error);
      toast.error('Failed to toggle keyframe');
    }
  };

  // Layer Management
  const handleLayerToggleVisible = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    try {
      await supabase
        .from('cinematic_layers')
        .update({ is_visible: !layer.is_visible })
        .eq('id', layerId);

      await loadProjectData();
    } catch (error: any) {
      console.error('Error toggling layer visibility:', error);
      toast.error('Failed to update layer');
    }
  };

  const handleLayerToggleLock = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    try {
      await supabase
        .from('cinematic_layers')
        .update({ is_locked: !layer.is_locked })
        .eq('id', layerId);

      await loadProjectData();
    } catch (error: any) {
      console.error('Error toggling layer lock:', error);
      toast.error('Failed to update layer');
    }
  };

  const handleLayerOpacityChange = async (layerId: string, opacity: number) => {
    try {
      await supabase
        .from('cinematic_layers')
        .update({ opacity })
        .eq('id', layerId);

      await loadProjectData();
    } catch (error: any) {
      console.error('Error updating layer opacity:', error);
    }
  };

  const handleLayerReorder = async (layerId: string, direction: 'up' | 'down') => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const newOrder = direction === 'up' ? layer.layer_order + 1 : layer.layer_order - 1;
    
    try {
      await supabase
        .from('cinematic_layers')
        .update({ layer_order: newOrder })
        .eq('id', layerId);

      await loadProjectData();
    } catch (error: any) {
      console.error('Error reordering layer:', error);
      toast.error('Failed to reorder layer');
    }
  };

  const handleLayerDelete = async (layerId: string) => {
    try {
      await supabase
        .from('cinematic_layers')
        .delete()
        .eq('id', layerId);

      await loadProjectData();
      toast.success('Layer deleted');
    } catch (error: any) {
      console.error('Error deleting layer:', error);
      toast.error('Failed to delete layer');
    }
  };

  const handleAddLayer = async () => {
    if (!currentProject) return;

    try {
      const maxOrder = Math.max(...layers.map(l => l.layer_order), -1);

      await supabase
        .from('cinematic_layers')
        .insert({
          project_id: currentProject.id,
          layer_name: `Layer ${layers.length + 1}`,
          layer_order: maxOrder + 1
        });

      await loadProjectData();
      toast.success('Layer added');
    } catch (error: any) {
      console.error('Error adding layer:', error);
      toast.error('Failed to add layer');
    }
  };

  const currentFrameData = frames[currentFrame];
  const previousFrameData = currentFrame > 0 ? frames[currentFrame - 1] : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Film className="h-8 w-8 text-primary" />
            Frame Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Professional 24fps frame-by-frame animation editor with full timeline control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Set up your cinematic animation project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="My Animation Project"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frame Rate (FPS)</Label>
                    <Select value={String(newProjectFps)} onValueChange={(v) => setNewProjectFps(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 FPS</SelectItem>
                        <SelectItem value="24">24 FPS (Cinematic)</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="60">60 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select value={newProjectRes} onValueChange={setNewProjectRes}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x1080">1920×1080 (FHD)</SelectItem>
                        <SelectItem value="3840x2160">3840×2160 (4K)</SelectItem>
                        <SelectItem value="1280x720">1280×720 (HD)</SelectItem>
                        <SelectItem value="1080x1920">1080×1920 (Vertical)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={createProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {projects.length > 0 && (
            <Select 
              value={currentProject?.id} 
              onValueChange={(id) => {
                const project = projects.find(p => p.id === id);
                setCurrentProject(project || null);
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title} ({project.fps} FPS)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!currentProject ? (
        <Card className="p-12 text-center">
          <Clapperboard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Project Selected</h3>
          <p className="text-muted-foreground mb-4">
            Create a new project or select an existing one to start
          </p>
          <Button onClick={() => setShowNewProject(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Project
          </Button>
        </Card>
      ) : loading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading project...</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Canvas and Layers */}
          <FrameCanvas
            currentFrameUrl={currentFrameData?.image_url}
            previousFrameUrl={previousFrameData?.image_url}
            layers={layers}
            onLayerToggleVisible={handleLayerToggleVisible}
            onLayerToggleLock={handleLayerToggleLock}
            onLayerOpacityChange={handleLayerOpacityChange}
            onLayerReorder={handleLayerReorder}
            onLayerDelete={handleLayerDelete}
            onAddLayer={handleAddLayer}
            showOnionSkin={showOnionSkin}
            onionSkinOpacity={onionSkinOpacity}
            onOnionSkinOpacityChange={setOnionSkinOpacity}
          />

          {/* Timeline */}
          <FrameTimeline
            frames={frames}
            currentFrame={currentFrame}
            fps={currentProject.fps}
            onFrameChange={setCurrentFrame}
            onAddFrame={handleAddFrame}
            onDeleteFrame={handleDeleteFrame}
            onToggleKeyframe={handleToggleKeyframe}
            onPlay={handlePlay}
            onPause={handlePause}
            isPlaying={isPlaying}
          />
        </div>
      )}
    </div>
  );
}
