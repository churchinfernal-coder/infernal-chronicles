import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Film,
  Clock,
  Layers,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  Settings,
  Maximize2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CinematicProject {
  id: string;
  title: string;
  fps: number;
  resolution_width: number;
  resolution_height: number;
  duration_seconds: number;
  status: string;
}

interface CinematicFrame {
  id: string;
  project_id: string;
  frame_number: number;
  image_url: string | null;
  is_keyframe: boolean;
  duration_frames: number;
  metadata: any;
}

interface CinematicLayer {
  id: string;
  project_id: string;
  layer_name: string;
  layer_order: number;
  is_visible: boolean;
  is_locked: boolean;
  opacity: number;
}

export default function CinematicFrameEditor() {
  const [projects, setProjects] = useState<CinematicProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<CinematicProject | null>(null);
  const [frames, setFrames] = useState<CinematicFrame[]>([]);
  const [layers, setLayers] = useState<CinematicLayer[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Project form
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectFps, setNewProjectFps] = useState(24);
  const [newProjectWidth, setNewProjectWidth] = useState(1920);
  const [newProjectHeight, setNewProjectHeight] = useState(1080);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchFrames();
      fetchLayers();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (isPlaying && selectedProject) {
      playAnimation();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, selectedProject]);

  useEffect(() => {
    renderCurrentFrame();
  }, [currentFrameIndex, frames, zoom]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('cinematic_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const fetchFrames = async () => {
    if (!selectedProject) return;
    
    try {
      const { data, error } = await supabase
        .from('cinematic_frames')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('frame_number');

      if (error) throw error;
      setFrames(data || []);
    } catch (error: any) {
      console.error('Error fetching frames:', error);
      toast.error('Failed to load frames');
    }
  };

  const fetchLayers = async () => {
    if (!selectedProject) return;
    
    try {
      const { data, error } = await supabase
        .from('cinematic_layers')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('layer_order');

      if (error) throw error;
      setLayers(data || []);
    } catch (error: any) {
      console.error('Error fetching layers:', error);
      toast.error('Failed to load layers');
    }
  };

  const createProject = async () => {
    if (!newProjectTitle.trim()) {
      toast.error('Project title is required');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cinematic_projects')
        .insert({
          user_id: user.id,
          title: newProjectTitle,
          fps: newProjectFps,
          resolution_width: newProjectWidth,
          resolution_height: newProjectHeight,
          duration_seconds: 1.0,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Project created successfully');
      setNewProjectTitle('');
      fetchProjects();
      setSelectedProject(data);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const addFrame = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const nextFrameNumber = frames.length;
      
      const { data, error } = await supabase
        .from('cinematic_frames')
        .insert({
          project_id: selectedProject.id,
          frame_number: nextFrameNumber,
          is_keyframe: false,
          duration_frames: 1
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Frame added');
      fetchFrames();
    } catch (error: any) {
      console.error('Error adding frame:', error);
      toast.error(error.message || 'Failed to add frame');
    } finally {
      setLoading(false);
    }
  };

  const deleteFrame = async (frameId: string) => {
    if (!confirm('Delete this frame?')) return;

    try {
      const { error } = await supabase
        .from('cinematic_frames')
        .delete()
        .eq('id', frameId);

      if (error) throw error;

      toast.success('Frame deleted');
      fetchFrames();
      if (currentFrameIndex >= frames.length - 1) {
        setCurrentFrameIndex(Math.max(0, frames.length - 2));
      }
    } catch (error: any) {
      console.error('Error deleting frame:', error);
      toast.error('Failed to delete frame');
    }
  };

  const toggleKeyframe = async (frame: CinematicFrame) => {
    try {
      const { error } = await supabase
        .from('cinematic_frames')
        .update({ is_keyframe: !frame.is_keyframe })
        .eq('id', frame.id);

      if (error) throw error;

      toast.success(frame.is_keyframe ? 'Keyframe removed' : 'Keyframe set');
      fetchFrames();
    } catch (error: any) {
      console.error('Error toggling keyframe:', error);
      toast.error('Failed to toggle keyframe');
    }
  };

  const uploadFrameImage = async (frameId: string, file: File) => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedProject.id}/${frameId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('design-editor')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('design-editor')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('cinematic_frames')
        .update({ image_url: publicUrl })
        .eq('id', frameId);

      if (updateError) throw updateError;

      toast.success('Frame image uploaded');
      fetchFrames();
    } catch (error: any) {
      console.error('Error uploading frame image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const playAnimation = () => {
    if (!selectedProject || frames.length === 0) return;

    const fps = selectedProject.fps;
    const frameDuration = 1000 / fps;
    let lastTime = performance.now();
    let frameIndex = currentFrameIndex;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - lastTime;

      if (elapsed >= frameDuration) {
        frameIndex = (frameIndex + 1) % frames.length;
        setCurrentFrameIndex(frameIndex);
        lastTime = currentTime;
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const renderCurrentFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedProject) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = selectedProject.resolution_width;
    canvas.height = selectedProject.resolution_height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render current frame
    const currentFrame = frames[currentFrameIndex];
    if (currentFrame?.image_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = currentFrame.image_url;
    } else {
      // Show frame placeholder
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#666666';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Frame ${currentFrameIndex + 1}`, canvas.width / 2, canvas.height / 2);
    }
  };

  const addLayer = async () => {
    if (!selectedProject) return;

    try {
      const nextOrder = layers.length;
      const { error } = await supabase
        .from('cinematic_layers')
        .insert({
          project_id: selectedProject.id,
          layer_name: `Layer ${nextOrder + 1}`,
          layer_order: nextOrder,
          is_visible: true,
          is_locked: false,
          opacity: 1.0
        });

      if (error) throw error;

      toast.success('Layer added');
      fetchLayers();
    } catch (error: any) {
      console.error('Error adding layer:', error);
      toast.error('Failed to add layer');
    }
  };

  const toggleLayerVisibility = async (layer: CinematicLayer) => {
    try {
      const { error } = await supabase
        .from('cinematic_layers')
        .update({ is_visible: !layer.is_visible })
        .eq('id', layer.id);

      if (error) throw error;
      fetchLayers();
    } catch (error: any) {
      console.error('Error toggling layer visibility:', error);
      toast.error('Failed to toggle layer');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Film className="h-8 w-8 text-primary" />
            Cinematic Frame Editor
          </h1>
          <p className="text-muted-foreground mt-2">
            24fps timeline editor with keyframes, layers, and frame-by-frame control
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Projects & Layers */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Project Title"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newProjectFps.toString()} onValueChange={(v) => setNewProjectFps(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 FPS</SelectItem>
                    <SelectItem value="24">24 FPS</SelectItem>
                    <SelectItem value="30">30 FPS</SelectItem>
                    <SelectItem value="60">60 FPS</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={createProject} disabled={loading} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`p-3 rounded cursor-pointer border ${
                    selectedProject?.id === project.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-sm truncate">{project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.fps} FPS • {project.resolution_width}x{project.resolution_height}
                  </p>
                </div>
              ))}
            </div>

            {selectedProject && (
              <>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Layers</Label>
                    <Button onClick={addLayer} size="sm" variant="ghost">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {layers.map((layer) => (
                      <div
                        key={layer.id}
                        className="flex items-center gap-2 p-2 rounded border border-border text-sm"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleLayerVisibility(layer)}
                        >
                          <Layers className={`h-3 w-3 ${layer.is_visible ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                        <span className="flex-1 truncate">{layer.layer_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Main Canvas Area */}
        <div className="col-span-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Canvas</CardTitle>
                {selectedProject && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {selectedProject.fps} FPS
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center'
                  }}
                  className="border border-primary/20"
                />
              </div>

              {selectedProject && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm">Zoom: {(zoom * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[zoom]}
                    onValueChange={(v) => setZoom(v[0])}
                    min={0.1}
                    max={2}
                    step={0.1}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Playback Controls */}
          {selectedProject && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentFrameIndex(0)}
                    disabled={currentFrameIndex === 0}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                    disabled={currentFrameIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={frames.length === 0}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1))}
                    disabled={currentFrameIndex >= frames.length - 1}
                  >
                    Next
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentFrameIndex(frames.length - 1)}
                    disabled={currentFrameIndex >= frames.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center mt-2 text-sm text-muted-foreground">
                  Frame {currentFrameIndex + 1} of {frames.length}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Timeline & Frame Management */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Timeline
              {selectedProject && (
                <Button onClick={addFrame} size="sm" disabled={loading}>
                  <Plus className="h-4 w-4 mr-1" />
                  Frame
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProject ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {frames.map((frame, index) => (
                  <div
                    key={frame.id}
                    onClick={() => setCurrentFrameIndex(index)}
                    className={`p-3 rounded border cursor-pointer ${
                      currentFrameIndex === index
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Frame {frame.frame_number + 1}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleKeyframe(frame);
                          }}
                        >
                          <Film className={`h-3 w-3 ${frame.is_keyframe ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFrame(frame.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      {frame.image_url ? (
                        <img
                          src={frame.image_url}
                          alt={`Frame ${frame.frame_number}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-20 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                      
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`frame-upload-${frame.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadFrameImage(frame.id, file);
                        }}
                      />
                      <label
                        htmlFor={`frame-upload-${frame.id}`}
                        className="absolute bottom-1 right-1 cursor-pointer"
                      >
                        <div className="bg-background/90 rounded p-1 hover:bg-primary/20">
                          <Upload className="h-3 w-3" />
                        </div>
                      </label>
                    </div>
                    
                    {frame.is_keyframe && (
                      <div className="text-xs text-primary mt-1">★ Keyframe</div>
                    )}
                  </div>
                ))}
                
                {frames.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No frames yet. Click "+ Frame" to add one.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Select or create a project to start
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
