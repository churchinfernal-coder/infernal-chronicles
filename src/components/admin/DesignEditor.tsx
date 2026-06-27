import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import WickedWorksPaywall from "@/pages/wicked-works/WickedWorksPaywall";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { DesignEditorTooltip } from "./DesignEditorTooltip";
import { DesignEditorMobileWarning } from "./DesignEditorMobileWarning";
import { 
  Canvas as FabricCanvas, 
  FabricObject, 
  Rect, 
  Circle, 
  IText, 
  PencilBrush, 
  FabricImage, 
  filters, 
  Shadow, 
  Polygon, 
  Point, 
  PatternBrush, 
  Ellipse,
  ActiveSelection
} from "fabric";
import { DesignEditorToolbar } from "./DesignEditorToolbar";
import { DesignEditorLayerPanel } from "./DesignEditorLayerPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileImage, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualizedProjectList } from "./VirtualizedProjectList";
import { PerformanceIndicator } from "./PerformanceIndicator";
import { StockAssetsPanel } from '../design-editor/StockAssetsPanel';
const ImageFilters = lazy(() => import("./ImageFilters").then(m => ({ default: m.ImageFilters })));
const ImageTransformTools = lazy(() => import("./ImageTransformTools").then(m => ({ default: m.ImageTransformTools })));
const DesignTemplates = lazy(() => import("./DesignTemplates").then(m => ({ default: m.DesignTemplates })));
const TextEffectsPanel = lazy(() => import("./TextEffectsPanel").then(m => ({ default: m.TextEffectsPanel })));
const BackgroundPanel = lazy(() => import("./BackgroundPanel").then(m => ({ default: m.BackgroundPanel })));
const SelectionToolsPanel = lazy(() => import("./SelectionToolsPanel").then(m => ({ default: m.SelectionToolsPanel })));
const AdvancedBrushPanel = lazy(() => import("./AdvancedBrushPanel").then(m => ({ default: m.AdvancedBrushPanel })));
const ShapeToolsPanel = lazy(() => import("./ShapeToolsPanel").then(m => ({ default: m. ShapeToolsPanel })));
const ExportPanel = lazy(() => import("./ExportPanel").then(m => ({ default: m.ExportPanel })));
const AISuggestionsPanel = lazy(() => import("./AISuggestionsPanel").then(m => ({ default: m.AISuggestionsPanel })));

declare module 'fabric' {
  interface FabricObject {
    id?: string;
    name?: string;
  }
}

const PanelSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

interface KeyboardShortcut {
  key: string;
  ctrl?:  boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: string;
}

interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode?:  string;
  fill?: number;
}

interface CanvasState {
  json: string;
  timestamp: number;
  description?:  string;
}

interface AutoSaveState {
  enabled: boolean;
  interval: number;
  lastSaved: number | null;
}

export function DesignEditor() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState("select");
  const [fillColor, setFillColor] = useState("#000000");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<FabricImage | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(800);
  const [selectionObject, setSelectionObject] = useState<Rect | Polygon | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [isDrawingLasso, setIsDrawingLasso] = useState(false);
  const [featherRadius, setFeatherRadius] = useState(0);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [cloneSourceX, setCloneSourceX] = useState<number | undefined>();
  const [cloneSourceY, setCloneSourceY] = useState<number | undefined>();
  const [isSettingCloneSource, setIsSettingCloneSource] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showPanels, setShowPanels] = useState(true);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  
  const [historyStack, setHistoryStack] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  const historySaveDebounceTime = 500;
  const historySaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [autoSave, setAutoSave] = useState<AutoSaveState>({
    enabled: true,
    interval: 30000,
    lastSaved:  null,
  });
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eventCleanupRef = useRef<(() => void)[]>([]);
  const [aiFilterValues, setAiFilterValues] = useState<any>(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data:  { user }, error:  userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setHasSubscription(false);
        setCheckingSubscription(false);
        return;
      }

      const { data: subscriptions, error:  subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('chamber_type', 'wicked_works')
        .eq('status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription check error:', subError);
      }

      setHasSubscription(!! subscriptions);
      setCheckingSubscription(false);
    } catch (error) {
      console.error('Subscription check failed:', error);
      setHasSubscription(false);
      setCheckingSubscription(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/wicked-works-purchase');
  };

  useEffect(() => {
    if (! canvasRef.current || !hasSubscription) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      enableRetinaScaling: true,
    });

    setFabricCanvas(canvas);
    updateLayers(canvas);

    const selectionCreated = () => updateLayers(canvas);
    const selectionUpdated = () => updateLayers(canvas);
    const selectionCleared = () => updateLayers(canvas);
    const objectAdded = () => {
      updateLayers(canvas);
      debouncedSaveToHistory(canvas);
    };
    const objectRemoved = () => {
      updateLayers(canvas);
      debouncedSaveToHistory(canvas);
    };
    const objectModified = () => {
      updateLayers(canvas);
      debouncedSaveToHistory(canvas);
    };

    canvas.on("selection:created", selectionCreated);
    canvas.on("selection:updated", selectionUpdated);
    canvas.on("selection:cleared", selectionCleared);
    canvas.on("object:added", objectAdded);
    canvas.on("object:removed", objectRemoved);
    canvas.on("object:modified", objectModified);

    const initTimer = setTimeout(() => {
      saveToHistoryImmediate(canvas);
    }, 100);

    return () => {
      clearTimeout(initTimer);
      canvas.off("selection:created", selectionCreated);
      canvas.off("selection:updated", selectionUpdated);
      canvas.off("selection:cleared", selectionCleared);
      canvas.off("object:added", objectAdded);
      canvas.off("object:removed", objectRemoved);
      canvas.off("object:modified", objectModified);
      
      eventCleanupRef.current. forEach(cleanup => cleanup());
      eventCleanupRef.current = [];
      
      if (historySaveTimerRef.current) {
        clearTimeout(historySaveTimerRef.current);
      }
      if (autoSaveTimerRef. current) {
        clearInterval(autoSaveTimerRef. current);
      }
      
      canvas.dispose();
    };
  }, [hasSubscription]);

  useEffect(() => {
    if (!fabricCanvas || !hasSubscription || !autoSave.enabled) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const canvasData = fabricCanvas.toJSON();
        const thumbnail = fabricCanvas.toDataURL({ format: "png", quality: 0.3, multiplier: 0.5 });

        localStorage.setItem('wicked_works_autosave', JSON.stringify({
          canvasData,
          timestamp: Date.now(),
        }));

        setAutoSave(prev => ({ ...prev, lastSaved: Date.now() }));
        
        console.log('✅ Auto-saved at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, autoSave.interval);

    autoSaveTimerRef.current = autoSaveInterval;

    return () => {
      if (autoSaveTimerRef. current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [fabricCanvas, hasSubscription, autoSave.enabled, autoSave.interval]);

  useEffect(() => {
    if (!fabricCanvas || !hasSubscription) return;

    const autoSaveData = localStorage.getItem('wicked_works_autosave');
    if (autoSaveData) {
      try {
        const { canvasData, timestamp } = JSON.parse(autoSaveData);
        const ageMinutes = (Date.now() - timestamp) / 1000 / 60;
        
        if (ageMinutes < 60) {
          const restore = window.confirm(
            `Found auto-saved work from ${Math.round(ageMinutes)} minutes ago. Restore it?`
          );
          
          if (restore) {
            fabricCanvas.loadFromJSON(canvasData, () => {
              fabricCanvas.renderAll();
              updateLayers(fabricCanvas);
              toast.success("Auto-save restored");
            });
          }
        }
      } catch (error) {
        console.error('Failed to restore auto-save:', error);
      }
    }
  }, [fabricCanvas, hasSubscription]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "brush" || activeTool === "eraser";

    if (fabricCanvas.isDrawingMode && fabricCanvas.freeDrawingBrush) {
      const brush = new PencilBrush(fabricCanvas);
      brush.color = activeTool === "eraser" ? "#ffffff" : fillColor;
      brush.width = brushSize;
      
      const rgba = activeTool === "eraser" 
        ? `rgba(255, 255, 255, ${brushOpacity / 100})`
        : hexToRgba(fillColor, brushOpacity / 100);
      brush.color = rgba;

      fabricCanvas.freeDrawingBrush = brush;
    }

    fabricCanvas.defaultCursor = activeTool === "move" ? "move" : "default";

    if (activeTool === "clone" || activeTool === "healing") {
      setupAdvancedBrushTool(activeTool);
    }
  }, [activeTool, fillColor, brushSize, fabricCanvas, brushOpacity, brushHardness]);

  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex. slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  const updateLayers = useCallback((canvas:  FabricCanvas) => {
    const objects = canvas.getObjects();
    const newLayers:  Layer[] = objects.map((obj, index) => ({
      id: obj.id || `layer-${index}-${Date.now()}`,
      name: obj.name || `${obj.type} ${index + 1}`,
      type: obj.type || "object",
      visible: obj.visible ??  true,
      locked: obj. selectable === false,
      opacity: obj. opacity ??  1,
      blendMode: (obj as any).globalCompositeOperation || 'source-over',
      fill: (obj. fill && typeof obj.fill === 'string') ? 1 : (obj as any).fillOpacity ??  1,
    }));
    setLayers(newLayers);

    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      setActiveLayerId(activeObj.id || null);
    }
  }, []);

  const saveToHistoryImmediate = useCallback((canvas: FabricCanvas) => {
    try {
      const json = JSON.stringify(canvas.toJSON());
      const newState:  CanvasState = {
        json,
        timestamp: Date. now(),
      };

      setHistoryStack(prev => {
        const newStack = prev.slice(0, historyIndex + 1);
        newStack.push(newState);
        
        if (newStack.length > maxHistorySize) {
          newStack.shift();
          return newStack;
        }
        return newStack;
      });
      
      setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
    } catch (error) {
      console.error('Failed to save history:', error);
      toast.error('Failed to save to history');
    }
  }, [historyIndex, maxHistorySize]);

  const debouncedSaveToHistory = useCallback((canvas: FabricCanvas) => {
    if (historySaveTimerRef. current) {
      clearTimeout(historySaveTimerRef.current);
    }

    historySaveTimerRef. current = setTimeout(() => {
      saveToHistoryImmediate(canvas);
    }, historySaveDebounceTime);
  }, [saveToHistoryImmediate, historySaveDebounceTime]);

  const undo = useCallback(() => {
    if (!fabricCanvas || historyIndex <= 0) {
      toast.error("Nothing to undo");
      return;
    }
    
    try {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = historyStack[newIndex];
      
      fabricCanvas.loadFromJSON(JSON.parse(state.json), () => {
        fabricCanvas.renderAll();
        updateLayers(fabricCanvas);
        toast.success("Undo applied");
      });
    } catch (error) {
      console.error('Undo failed:', error);
      toast.error('Undo failed');
    }
  }, [fabricCanvas, historyIndex, historyStack, updateLayers]);

  const redo = useCallback(() => {
    if (!fabricCanvas || historyIndex >= historyStack.length - 1) {
      toast.error("Nothing to redo");
      return;
    }
    
    try {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = historyStack[newIndex];
      
      fabricCanvas.loadFromJSON(JSON.parse(state.json), () => {
        fabricCanvas.renderAll();
        updateLayers(fabricCanvas);
        toast.success("Redo applied");
      });
    } catch (error) {
      console.error('Redo failed:', error);
      toast.error('Redo failed');
    }
  }, [fabricCanvas, historyIndex, historyStack, updateLayers]);

  const handleToolChange = useCallback((tool: string) => {
    eventCleanupRef.current.forEach(cleanup => cleanup());
    eventCleanupRef.current = [];

    setActiveTool(tool);
    if (! fabricCanvas) return;

    if (selectionObject) {
      fabricCanvas.remove(selectionObject);
      setSelectionObject(null);
    }

    setIsDrawingLasso(false);
    setLassoPoints([]);

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: fillColor,
        stroke:  strokeColor,
        strokeWidth:  2,
        width: 200,
        height:  150,
      });
      rect.id = `rect-${Date.now()}`;
      rect.name = 'Rectangle';
      fabricCanvas. add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        radius: 75,
      });
      circle.id = `circle-${Date.now()}`;
      circle.name = 'Circle';
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (tool === "text") {
      const text = new IText("Text", {
        left: 100,
        top: 100,
        fill: fillColor,
        fontSize: 32,
      });
      text.id = `text-${Date.now()}`;
      text.name = 'Text';
      fabricCanvas.add(text);
      fabricCanvas. setActiveObject(text);
    }

    if (tool === "marquee") {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "crosshair";
      toast.info("Click and drag to create rectangular selection");
      setupMarqueeSelection();
    } else if (tool === "lasso") {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "crosshair";
      toast. info("Draw freehand selection path");
      setupLassoSelection();
    } else {
      fabricCanvas.selection = tool === "select";
      fabricCanvas.defaultCursor = tool === "move" ? "move" : "default";
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, fillColor, strokeColor, selectionObject]);

  const handleUploadImage = useCallback(async (file: File) => {
    if (!fabricCanvas) return;

    const fileSizeMB = file.size / (1024 * 1024);
    
    setIsProcessing(true);
    setProcessingMessage(`Uploading image (${fileSizeMB.toFixed(2)} MB)...`);
    
    if (fileSizeMB > 2) {
      try {
        const { optimizeImageForWeb } = await import('@/lib/imageProcessing');
        setProcessingMessage("Optimizing image.. .");
        const result = await optimizeImageForWeb(file);
        
        FabricImage.fromURL(result.processedImage).then((fabricImg) => {
          fabricImg.set({
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
          });
          
          fabricImg.id = `img-${Date.now()}`;
          fabricImg.name = file.name;
          
          fabricCanvas.add(fabricImg);
          fabricCanvas.renderAll();
          
          const cacheStatus = result.fromCache ? ' (from cache)' : '';
          toast.success(`Image optimized${cacheStatus} (${Math.round(result.metadata.size / 1024)}KB)`);
          setIsProcessing(false);
          setProcessingMessage("");
        });
      } catch (error) {
        console.error('Image processing error:', error);
        toast.error("Failed to process image.  Using original.");
        loadImageClientSide(file, fabricCanvas);
      }
    } else {
      loadImageClientSide(file, fabricCanvas);
    }
  }, [fabricCanvas]);

  const loadImageClientSide = useCallback((file: File, canvas: FabricCanvas) => {
    const reader = new FileReader();
    
    reader.onloadstart = () => {
      setProcessingMessage("Loading image...");
    };
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        FabricImage.fromURL(e.target?. result as string).then((fabricImg) => {
          fabricImg. set({
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
          });
          
          fabricImg. id = `img-${Date.now()}`;
          fabricImg.name = file.name;
          
          canvas.add(fabricImg);
          canvas.renderAll();
          toast.success("Image loaded");
          setIsProcessing(false);
          setProcessingMessage("");
        });
      };
      img.onerror = () => {
        toast.error("Failed to load image");
        setIsProcessing(false);
        setProcessingMessage("");
      };
      img. src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsProcessing(false);
      setProcessingMessage("");
    };
    
    reader.readAsDataURL(file);
  }, []);
    const handleExport = useCallback(async (format: string, quality: number, filename: string) => {
    if (!fabricCanvas) return;

    setIsProcessing(true);
    setProcessingMessage(`Exporting as ${format. toUpperCase()}...`);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      let dataURL:  string;
      
      if (format === "svg") {
        const svgData = fabricCanvas.toSVG();
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.download = `${filename || 'design'}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success("SVG exported successfully");
        setIsProcessing(false);
        setProcessingMessage("");
        return;
      }

      dataURL = fabricCanvas.toDataURL({
        format:  format === "jpeg" ? "jpeg" : format === "webp" ? "webp" :  "png",
        quality: quality / 100,
        multiplier: 2,
      });

      const link = document.createElement("a");
      link.download = `${filename || 'design'}.${format}`;
      link.href = dataURL;
      link.click();

      toast.success(`Image exported as ${format.toUpperCase()}`);
      setIsProcessing(false);
      setProcessingMessage("");
    } catch (error:  any) {
      toast.error(`Export failed: ${error.message}`);
      setIsProcessing(false);
      setProcessingMessage("");
    }
  }, [fabricCanvas]);

  const handleSave = useCallback(async () => {
    if (!fabricCanvas) {
      toast.error("Canvas not initialized");
      return;
    }

    if (! projectName. trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Saving project...");

    try {
      const { data: { user } } = await supabase. auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const canvasData = fabricCanvas.toJSON();
      const thumbnail = fabricCanvas.toDataURL({ format: "png", quality: 0.5, multiplier: 1 });

      const { error } = await supabase.from("design_projects").insert({
        user_id: user.id,
        name: projectName. trim(),
        canvas_data:  canvasData,
        thumbnail_url: thumbnail,
        width: fabricCanvas.width || 1200,
        height: fabricCanvas. height || 800,
      } as any);

      if (error) throw error;

      toast. success("Project saved successfully");
      setShowSaveDialog(false);
      setProjectName("");
      
      localStorage.removeItem('wicked_works_autosave');
      
      setIsProcessing(false);
      setProcessingMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save project");
      setIsProcessing(false);
      setProcessingMessage("");
    }
  }, [fabricCanvas, projectName]);

  const handleLoad = useCallback(async () => {
    setIsProcessing(true);
    setProcessingMessage("Loading projects...");

    try {
      const { data: { user } } = await supabase.auth. getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("design_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending:  false });

      if (error) throw error;

      setProjects(data || []);
      setShowLoadDialog(true);
      setIsProcessing(false);
      setProcessingMessage("");
    } catch (error:  any) {
      toast.error(error.message || "Failed to load projects");
      setIsProcessing(false);
      setProcessingMessage("");
    }
  }, []);

  const loadProject = useCallback((project: any) => {
    if (!fabricCanvas) return;

    setIsProcessing(true);
    setProcessingMessage("Loading project...");

    try {
      fabricCanvas.loadFromJSON(project. canvas_data, () => {
        fabricCanvas.renderAll();
        updateLayers(fabricCanvas);
        saveToHistoryImmediate(fabricCanvas);
        toast.success("Project loaded successfully");
        setShowLoadDialog(false);
        setIsProcessing(false);
        setProcessingMessage("");
      });
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error("Failed to load project");
      setIsProcessing(false);
      setProcessingMessage("");
    }
  }, [fabricCanvas, updateLayers, saveToHistoryImmediate]);

  const handleClear = useCallback(() => {
    if (!fabricCanvas) return;
    
    const confirm = window.confirm("Clear entire canvas?  This cannot be undone.");
    if (!confirm) return;

    saveToHistoryImmediate(fabricCanvas);
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast.success("Canvas cleared");
  }, [fabricCanvas, saveToHistoryImmediate]);

  const handleApplyFilter = useCallback(async (filterType: string, value?:  number | any) => {
    const activeObj = fabricCanvas?. getActiveObject();
    if (!activeObj || !(activeObj instanceof FabricImage)) {
      toast.error("Please select an image first");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage(`Applying ${filterType} filter...`);

    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      const img = activeObj as FabricImage;

      switch (filterType) {
        case 'brightness':
          img.filters = [new filters.Brightness({ brightness: (value || 0) / 100 })];
          break;
        case 'contrast': 
          img.filters = [new filters.Contrast({ contrast: (value || 0) / 100 })];
          break;
        case 'saturation':
          img.filters = [new filters.Saturation({ saturation: (value || 0) / 100 })];
          break;
        case 'hue':
          img.filters = [new filters.HueRotation({ rotation: (value || 0) / 180 })];
          break;
        case 'lightness':
          img.filters = [new filters. Brightness({ brightness: (value || 0) / 100 })];
          break;
        case 'blur':
          img.filters = [new filters.Blur({ blur: (value || 0) / 20 })];
          break;
        case 'levels':
          if (value && typeof value === 'object') {
            const { inputShadows, inputMidtones, inputHighlights, outputShadows, outputHighlights } = value;
            const shadowAdjust = (inputShadows / 255) - 0.5;
            const highlightAdjust = (inputHighlights / 255) - 0.5;
            const midtoneAdjust = (inputMidtones / 128) - 1;
            const outputRange = (outputHighlights - outputShadows) / 255;
            img.filters = [
              new filters. Brightness({ brightness: shadowAdjust + midtoneAdjust }),
              new filters.Contrast({ contrast: outputRange - 0.5 })
            ];
          }
          break;
        case 'grayscale':
          img.filters = [new filters.Grayscale()];
          break;
        case 'sepia': 
          img.filters = [new filters.Sepia()];
          break;
        case 'invert':
          img.filters = [new filters.Invert()];
          break;
        case 'sharpen':
          img.filters = [new filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] })];
          break;
        case 'emboss':
          img.filters = [new filters.Convolute({ matrix: [-2, -1, 0, -1, 1, 1, 0, 1, 2] })];
          break;
        case 'edgeDetect':
          img. filters = [new filters.Convolute({ matrix: [-1, -1, -1, -1, 8, -1, -1, -1, -1] })];
          break;
        case 'reset':
          img.filters = [];
          break;
        default:
          throw new Error(`Unknown filter: ${filterType}`);
      }

      img.applyFilters();
      fabricCanvas?. renderAll();
      toast.success(`${filterType} filter applied`);
      
      setIsProcessing(false);
      setProcessingMessage("");
    } catch (error: any) {
      console.error('Filter application failed:', error);
      toast.error(`Failed to apply filter: ${error. message}`);
      setIsProcessing(false);
      setProcessingMessage("");
    }
  }, [fabricCanvas]);

  const handleCrop = useCallback(() => {
    const activeObj = fabricCanvas?.getActiveObject();
    if (!activeObj || !(activeObj instanceof FabricImage)) {
      toast.error("Please select an image first");
      return;
    }
    toast.info("Use the corner handles to define crop area, then click outside to apply");
    activeObj.set({ cropX: 0, cropY: 0 });
    fabricCanvas?.renderAll();
  }, [fabricCanvas]);

  const handleResize = useCallback((width: number, height: number) => {
    if (!fabricCanvas) return;

    if (width < 100 || height < 100) {
      toast.error("Canvas must be at least 100x100 pixels");
      return;
    }

    if (width > 8000 || height > 8000) {
      toast.error("Canvas cannot exceed 8000x8000 pixels");
      return;
    }

    fabricCanvas.setDimensions({ width, height });
    setCanvasWidth(width);
    setCanvasHeight(height);
    fabricCanvas.renderAll();
    toast.success(`Canvas resized to ${width}x${height}`);
  }, [fabricCanvas]);

  const handleRotate = useCallback((angle: number) => {
    const activeObj = fabricCanvas?.getActiveObject();
    if (!activeObj) {
      toast.error("Please select an object first");
      return;
    }
    activeObj.rotate((activeObj.angle || 0) + angle);
    fabricCanvas?.renderAll();
    toast.success(`Rotated ${angle}°`);
  }, [fabricCanvas]);

  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    const activeObj = fabricCanvas?.getActiveObject();
    if (!activeObj) {
      toast.error("Please select an object first");
      return;
    }
    if (direction === 'horizontal') {
      activeObj.set('flipX', !activeObj.flipX);
    } else {
      activeObj.set('flipY', !activeObj.flipY);
    }
    fabricCanvas?.renderAll();
    toast.success(`Flipped ${direction}`);
  }, [fabricCanvas]);

  const handleUpdateText = useCallback((options: any) => {
    const activeObj = fabricCanvas?.getActiveObject();
    if (!activeObj || !(activeObj instanceof IText)) {
      toast.error("Please select a text object first");
      return;
    }

    if (options.textContent !== undefined) activeObj.set('text', options. textContent);
    if (options.fontFamily) activeObj.set('fontFamily', options.fontFamily);
    if (options.fontSize) activeObj.set('fontSize', options.fontSize);
    if (options.fontWeight) activeObj.set('fontWeight', options.fontWeight);
    if (options.fontStyle) activeObj.set('fontStyle', options.fontStyle);
    if (options.textAlign) activeObj.set('textAlign', options.textAlign);
    if (options.lineHeight) activeObj.set('lineHeight', options.lineHeight);
    if (options.letterSpacing !== undefined) activeObj.set('charSpacing', options.letterSpacing * 10);
    if (options.textDecoration) {
      activeObj.set('underline', options.textDecoration === 'underline');
      activeObj.set('linethrough', options.textDecoration === 'line-through');
      activeObj.set('overline', options.textDecoration === 'overline');
    }
    
    if (options.textTransform) {
      const currentText = activeObj.text || '';
      let transformedText = currentText;
      switch (options.textTransform) {
        case 'uppercase':  transformedText = currentText.toUpperCase(); break;
        case 'lowercase': transformedText = currentText.toLowerCase(); break;
        case 'capitalize': transformedText = currentText.replace(/\b\w/g, l => l.toUpperCase()); break;
      }
      activeObj.set('text', transformedText);
    }

    if (options.shadow) {
      activeObj.set('shadow', new Shadow({ 
        color: 'rgba(0,0,0,0.5)', 
        blur: 10, 
        offsetX: 5, 
        offsetY: 5 
      }));
    }

    if (options.stroke) {
      activeObj.set({ 
        stroke: strokeColor, 
        strokeWidth:  options.strokeWidth || 2 
      });
    }

    fabricCanvas?.renderAll();
    toast.success("Text updated");
  }, [fabricCanvas, strokeColor]);

  const handleAddText = useCallback(() => {
    if (!fabricCanvas) return;
    const text = new IText("New Text", {
      left: 100,
      top:  100,
      fill: fillColor,
      fontSize: 32,
      fontFamily: 'Arial, sans-serif',
      editable: true,
    });
    
    text.id = `text-${Date.now()}`;
    text.name = 'Text Layer';
    
    fabricCanvas. add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Text layer added - double-click to edit");
  }, [fabricCanvas, fillColor]);

  const handleAddShape = useCallback((shapeType: string, options: any) => {
    if (!fabricCanvas) return;
    let shape:  FabricObject | null = null;

    const shapeId = `${shapeType}-${Date.now()}`;
    const shapeName = `${shapeType. charAt(0).toUpperCase() + shapeType.slice(1)} Layer`;

    switch (shapeType) {
      case 'rectangle':
        shape = new Rect({
          left: 100, 
          top: 100, 
          width: options.width || 200, 
          height: options.height || 150,
          fill: options.fill || fillColor, 
          stroke: options.stroke || strokeColor,
          strokeWidth: options.strokeWidth || 2, 
          opacity: options.opacity || 1,
        });
        break;
      case 'circle':
        shape = new Circle({
          left: 100, 
          top: 100, 
          radius: options.radius || 75,
          fill: options.fill || fillColor, 
          stroke: options.stroke || strokeColor,
          strokeWidth: options.strokeWidth || 2, 
          opacity: options.opacity || 1,
        });
        break;
      case 'ellipse':
        shape = new Ellipse({
          left: 100, 
          top: 100, 
          rx: (options.width || 200) / 2, 
          ry: (options.height || 150) / 2,
          fill: options. fill || fillColor, 
          stroke: options.stroke || strokeColor,
          strokeWidth: options. strokeWidth || 2, 
          opacity: options.opacity || 1,
        });
        break;
      case 'polygon':
      case 'triangle':
        const sides = options.sides || 6;
        const radius = options.radius || 75;
        const points:  Point[] = [];
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          points.push(new Point(radius * Math.cos(angle), radius * Math.sin(angle)));
        }
        shape = new Polygon(points, {
          left: 100, 
          top: 100, 
          fill: options.fill || fillColor,
          stroke: options.stroke || strokeColor, 
          strokeWidth: options. strokeWidth || 2,
          opacity: options.opacity || 1,
        });
        break;
      case 'star':
        const starPoints:  Point[] = [];
        const outerRadius = options.radius || 75;
        const innerRadius = outerRadius * 0.5;
        const numPoints = (options.sides || 5) * 2;
        for (let i = 0; i < numPoints; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / (numPoints / 2) - Math.PI / 2;
          starPoints.push(new Point(radius * Math.cos(angle), radius * Math.sin(angle)));
        }
        shape = new Polygon(starPoints, {
          left: 100, 
          top: 100, 
          fill: options.fill || fillColor,
          stroke: options.stroke || strokeColor, 
          strokeWidth: options.strokeWidth || 2,
          opacity: options. opacity || 1,
        });
        break;
    }

    if (shape) {
      shape.id = shapeId;
      shape.name = shapeName;
      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.renderAll();
      toast.success(`${shapeType. charAt(0).toUpperCase() + shapeType.slice(1)} added`);
    }
  }, [fabricCanvas, fillColor, strokeColor]);

  const handleSetBackground = useCallback((type: string, value: string) => {
    if (!fabricCanvas) return;
    fabricCanvas.backgroundColor = value;
    fabricCanvas.renderAll();
    toast.success("Background updated");
  }, [fabricCanvas]);

  const handleSelectTemplate = useCallback((template: any) => {
    if (!fabricCanvas) return;
    
    if (template.width && template.height) {
      fabricCanvas.setDimensions({ width: template.width, height: template.height });
      setCanvasWidth(template.width);
      setCanvasHeight(template.height);
    }
    
    fabricCanvas.renderAll();
    toast.success(`Template "${template.name}" applied`);
  }, [fabricCanvas]);

  const setupMarqueeSelection = useCallback(() => {
    if (!fabricCanvas) return;
    
    let isDown = false;
    let origX = 0;
    let origY = 0;
    let rect:  Rect | null = null;

    const onMouseDown = (o: any) => {
      isDown = true;
      const pointer = fabricCanvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;
      rect = new Rect({
        left: origX, 
        top: origY, 
        width: 0, 
        height: 0,
        fill: 'rgba(0, 123, 255, 0.2)', 
        stroke: '#007bff',
        strokeWidth:  2, 
        strokeDashArray: [5, 5], 
        selectable: false, 
        evented: false,
      });
      rect.id = `selection-${Date.now()}`;
      rect.name = 'Marquee Selection';
      fabricCanvas.add(rect);
    };

    const onMouseMove = (o: any) => {
      if (!isDown || ! rect) return;
      const pointer = fabricCanvas.getPointer(o.e);
      if (pointer.x < origX) rect.set({ left: pointer.x });
      if (pointer.y < origY) rect.set({ top: pointer.y });
      rect.set({ 
        width: Math.abs(origX - pointer.x), 
        height: Math.abs(origY - pointer.y) 
      });
      fabricCanvas.renderAll();
    };

    const onMouseUp = () => {
      isDown = false;
      if (rect) {
        setSelectionObject(rect);
        toast.success("Selection created.  Use Selection Tools panel to manipulate.");
      }
      cleanup();
    };

    const cleanup = () => {
      fabricCanvas.off('mouse:down', onMouseDown);
      fabricCanvas.off('mouse:move', onMouseMove);
      fabricCanvas.off('mouse:up', onMouseUp);
    };

    fabricCanvas.on('mouse:down', onMouseDown);
    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);

    eventCleanupRef.current. push(cleanup);
  }, [fabricCanvas]);

  const setupLassoSelection = useCallback(() => {
    if (!fabricCanvas) return;
    
    const points:  Point[] = [];
    let isDrawing = false;

    const onMouseDown = (o: any) => {
      isDrawing = true;
      const pointer = fabricCanvas.getPointer(o.e);
      points.push(new Point(pointer.x, pointer. y));
    };

    const onMouseMove = (o: any) => {
      if (!isDrawing) return;
      const pointer = fabricCanvas.getPointer(o. e);
      points.push(new Point(pointer. x, pointer.y));
      
      if (points.length > 1) {
        const lastPoint = points[points.length - 1];
        const prevPoint = points[points.length - 2];
        fabricCanvas.renderAll();
        const ctx = fabricCanvas.getContext();
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const onMouseUp = () => {
      isDrawing = false;
      if (points.length > 2) {
        const polygon = new Polygon(points, {
          fill: 'rgba(0, 123, 255, 0.2)', 
          stroke: '#007bff',
          strokeWidth: 2, 
          strokeDashArray:  [5, 5], 
          selectable: false, 
          evented: false,
        });
        polygon.id = `lasso-${Date.now()}`;
        polygon.name = 'Lasso Selection';
        fabricCanvas.add(polygon);
        setSelectionObject(polygon);
        toast.success("Lasso selection created");
      }
      
      points.length = 0;
      cleanup();
    };

    const cleanup = () => {
      fabricCanvas.off('mouse:down', onMouseDown);
      fabricCanvas.off('mouse:move', onMouseMove);
      fabricCanvas. off('mouse:up', onMouseUp);
    };

    fabricCanvas.on('mouse:down', onMouseDown);
    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);

    eventCleanupRef.current.push(cleanup);
  }, [fabricCanvas]);

  const setupAdvancedBrushTool = useCallback((tool: 'clone' | 'healing') => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const onMouseDown = (o: any) => {
      const pointer = fabricCanvas.getPointer(o.e);
      
      if (o.e.altKey && tool === 'clone') {
        setCloneSourceX(pointer.x);
        setCloneSourceY(pointer.y);
        toast.success("Clone source set");
        return;
      }
      
      if (tool === 'clone' && (cloneSourceX === undefined || cloneSourceY === undefined)) {
        toast.error("Please set clone source first (Alt+Click)");
        return;
      }
      
      isDrawing = true;
      lastX = pointer.x;
      lastY = pointer.y;
    };

    const onMouseMove = (o: any) => {
      if (!isDrawing) return;
      
      const pointer = fabricCanvas.getPointer(o.e);
      const ctx = fabricCanvas.getContext();

      if (tool === 'clone' && cloneSourceX !== undefined && cloneSourceY !== undefined) {
        const offsetX = pointer.x - lastX;
        const offsetY = pointer.y - lastY;
        
        ctx.save();
        ctx.globalAlpha = brushOpacity / 100;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, brushSize / 2, 0, 2 * Math.PI);
        ctx.clip();
        
        try {
          ctx.drawImage(
            fabricCanvas.getElement(),
            cloneSourceX + offsetX - brushSize / 2,
            cloneSourceY + offsetY - brushSize / 2,
            brushSize,
            brushSize,
            pointer.x - brushSize / 2,
            pointer.y - brushSize / 2,
            brushSize,
            brushSize
          );
        } catch (e) {
          console. error("Clone error:", e);
        }
        
        ctx.restore();
      } else if (tool === 'healing') {
        ctx.save();
        ctx.globalAlpha = brushOpacity / 100;
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, brushSize / 2, 0, 2 * Math.PI);
        ctx.clip();
        
        try {
          ctx.drawImage(
            fabricCanvas.getElement(),
            pointer.x - brushSize,
            pointer.y - brushSize,
            brushSize * 2,
            brushSize * 2,
            pointer.x - brushSize / 2,
            pointer.y - brushSize / 2,
            brushSize,
            brushSize
          );
        } catch (e) {
          console.error("Healing error:", e);
        }
        
        ctx. restore();
      }
      
      lastX = pointer.x;
      lastY = pointer.y;
      fabricCanvas.renderAll();
    };

    const onMouseUp = () => {
      isDrawing = false;
    };

    const cleanup = () => {
      fabricCanvas.off('mouse:down', onMouseDown);
      fabricCanvas.off('mouse:move', onMouseMove);
      fabricCanvas. off('mouse:up', onMouseUp);
    };

    fabricCanvas.on('mouse:down', onMouseDown);
    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);

    eventCleanupRef.current.push(cleanup);
  }, [fabricCanvas, brushSize, brushOpacity, cloneSourceX, cloneSourceY]);

  const handleSetCloneSource = useCallback(() => {
    setIsSettingCloneSource(true);
    toast.info("Alt+Click on the canvas to set clone source");
  }, []);

  const handleBrushToolActivate = useCallback((tool: 'brush' | 'eraser' | 'clone' | 'healing') => {
    setActiveTool(tool);
  }, []);

  const handleCropSelection = useCallback(() => {
    if (!selectionObject || !fabricCanvas) {
      toast.error("No active selection");
      return;
    }
    
    const bounds = selectionObject.getBoundingRect();
    const cropOverlay = new Rect({
      left: bounds. left,
      top: bounds. top,
      width: bounds. width,
      height: bounds. height,
      fill: 'transparent',
      stroke: '#00ff00',
      strokeWidth:  3,
      strokeDashArray: [10, 5],
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: false,
    });
    
    cropOverlay.id = `crop-overlay-${Date.now()}`;
    cropOverlay.name = 'Crop Overlay';
    
    fabricCanvas.add(cropOverlay);
    fabricCanvas.setActiveObject(cropOverlay);
    fabricCanvas.renderAll();
    toast.success("Crop overlay created.  Resize and confirm to crop.");
  }, [selectionObject, fabricCanvas]);

  const handleDeleteSelection = useCallback(() => {
    if (!selectionObject || !fabricCanvas) {
      toast.error("No active selection");
      return;
    }
    
    const bounds = selectionObject.getBoundingRect();
    const rect = new Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      fill: fabricCanvas.backgroundColor as string || '#ffffff',
      selectable: false,
    });
    
    rect.id = `deleted-area-${Date.now()}`;
    rect.name = 'Deleted Area';
    
    fabricCanvas.add(rect);
    fabricCanvas.remove(selectionObject);
    setSelectionObject(null);
    toast.success("Selection deleted");
  }, [selectionObject, fabricCanvas]);

  const handleExtractSelection = useCallback(() => {
    if (!selectionObject || ! fabricCanvas) {
      toast.error("No active selection");
      return;
    }
    
    try {
      const bounds = selectionObject.getBoundingRect();
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      });
      
      const link = document.createElement("a");
      link.download = `selection-${Date.now()}.png`;
      link.href = dataURL;
      link. click();
      
      toast.success("Selection extracted");
    } catch (error) {
      console.error('Extract selection failed:', error);
      toast.error("Failed to extract selection");
    }
  }, [selectionObject, fabricCanvas]);

  const handleInvertSelection = useCallback(() => {
    if (!selectionObject || !fabricCanvas) {
      toast.error("No active selection");
      return;
    }
    
    const canvasBounds = {
      left: 0,
      top: 0,
      width: fabricCanvas. width || 1200,
      height: fabricCanvas. height || 800
    };
    
    const invertedMask = new Rect({
      left: canvasBounds.left,
      top: canvasBounds.top,
      width: canvasBounds.width,
      height: canvasBounds. height,
      fill: 'rgba(0, 123, 255, 0.2)',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable:  false,
      evented: false,
    });
    
    invertedMask.id = `inverted-selection-${Date.now()}`;
    invertedMask.name = 'Inverted Selection';
    
    fabricCanvas.remove(selectionObject);
    fabricCanvas.add(invertedMask);
    setSelectionObject(invertedMask);
    toast.success("Selection inverted");
  }, [selectionObject, fabricCanvas]);
    const keyboardShortcuts:  KeyboardShortcut[] = useMemo(() => [
    { 
      key: 's', 
      ctrl: true, 
      action: () => setShowSaveDialog(true), 
      description: 'Save project', 
      category: 'File' 
    },
    { 
      key: 'o', 
      ctrl: true, 
      action: () => handleLoad(), 
      description: 'Open project', 
      category: 'File' 
    },
    { 
      key: 'e', 
      ctrl: true, 
      action: () => handleExport("png", 100, `design-${Date.now()}`), 
      description: 'Export image', 
      category: 'File' 
    },
    { 
      key: 'z', 
      ctrl: true, 
      action: undo, 
      description: 'Undo', 
      category: 'Edit' 
    },
    { 
      key: 'z', 
      ctrl: true, 
      shift: true, 
      action:  redo, 
      description:  'Redo', 
      category: 'Edit' 
    },
    { 
      key: 'y', 
      ctrl: true, 
      action: redo, 
      description: 'Redo (alternative)', 
      category: 'Edit' 
    },
    { 
      key: 'Delete', 
      action: () => {
        const activeObj = fabricCanvas?. getActiveObject();
        if (activeObj) {
          fabricCanvas?.remove(activeObj);
          fabricCanvas?.renderAll();
          toast.success("Object deleted");
        }
      }, 
      description: 'Delete selected', 
      category: 'Edit' 
    },
    { 
      key: 'a', 
      ctrl: true, 
      action: () => {
        if (fabricCanvas) {
          const allObjects = fabricCanvas.getObjects();
          const selection = new ActiveSelection(allObjects, { canvas: fabricCanvas });
          fabricCanvas.setActiveObject(selection);
          fabricCanvas.renderAll();
          toast.success("All objects selected");
        }
      }, 
      description: 'Select all', 
      category:  'Edit' 
    },
    { 
      key:  'd', 
      ctrl: true, 
      action: () => {
        fabricCanvas?.discardActiveObject();
        fabricCanvas?.renderAll();
        toast.success("Selection cleared");
      }, 
      description: 'Deselect all', 
      category: 'Edit' 
    },
    { 
      key: 'v', 
      action: () => setActiveTool('select'), 
      description: 'Select tool', 
      category:  'Tools' 
    },
    { 
      key:  'b', 
      action: () => setActiveTool('brush'), 
      description: 'Brush tool', 
      category: 'Tools' 
    },
    { 
      key: 'e', 
      action:  () => setActiveTool('eraser'), 
      description: 'Eraser tool', 
      category: 'Tools' 
    },
    { 
      key: 't', 
      action: () => setActiveTool('text'), 
      description: 'Text tool', 
      category:  'Tools' 
    },
    { 
      key:  'r', 
      action: () => setActiveTool('rectangle'), 
      description: 'Rectangle tool', 
      category:  'Tools' 
    },
    { 
      key:  'c', 
      action: () => setActiveTool('circle'), 
      description: 'Circle tool', 
      category:  'Tools' 
    },
    { 
      key:  'm', 
      action: () => setActiveTool('marquee'), 
      description: 'Marquee selection', 
      category: 'Tools' 
    },
    { 
      key: 'l', 
      action: () => setActiveTool('lasso'), 
      description: 'Lasso selection', 
      category: 'Tools' 
    },
    { 
      key: '+', 
      ctrl: true, 
      action:  () => {
        if (fabricCanvas) {
          const zoom = fabricCanvas.getZoom();
          fabricCanvas.setZoom(Math.min(zoom * 1.1, 20));
          fabricCanvas.renderAll();
          toast.success(`Zoom:  ${Math.round(fabricCanvas. getZoom() * 100)}%`);
        }
      }, 
      description: 'Zoom in', 
      category: 'View' 
    },
    { 
      key: '-', 
      ctrl: true, 
      action: () => {
        if (fabricCanvas) {
          const zoom = fabricCanvas.getZoom();
          fabricCanvas.setZoom(Math.max(zoom * 0.9, 0.1));
          fabricCanvas.renderAll();
          toast.success(`Zoom: ${Math.round(fabricCanvas.getZoom() * 100)}%`);
        }
      }, 
      description:  'Zoom out', 
      category: 'View' 
    },
    { 
      key: '0', 
      ctrl: true, 
      action:  () => {
        if (fabricCanvas) {
          fabricCanvas.setZoom(1);
          fabricCanvas.renderAll();
          toast.success("Zoom reset to 100%");
        }
      }, 
      description: 'Reset zoom', 
      category: 'View' 
    },
    { 
      key: 'h', 
      ctrl: true, 
      action:  () => {
        setShowPanels(!showPanels);
        toast.success(showPanels ? "Panels hidden" : "Panels shown");
      }, 
      description: 'Hide/Show panels', 
      category: 'View' 
    },
    { 
      key: '? ', 
      ctrl: true, 
      action:  () => setShowShortcutsDialog(true), 
      description: 'Show shortcuts', 
      category: 'Help' 
    },
  ], [fabricCanvas, undo, redo, handleExport, handleLoad, showPanels]);

  useKeyboardShortcuts(keyboardShortcuts);

  if (checkingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-muted-foreground">Loading Wicked Works...</p>
        </div>
      </div>
    );
  }

  if (! hasSubscription) {
    return <WickedWorksPaywall onUpgrade={handleUpgrade} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background" role="application" aria-label="Wicked Works Design Editor">
      <DesignEditorMobileWarning />

      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-9999 flex items-center justify-center">
          <div className="bg-card border-2 border-purple-600 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="text-lg font-semibold text-center">{processingMessage}</p>
              <p className="text-sm text-muted-foreground text-center">Please wait... </p>
            </div>
          </div>
        </div>
      )}

      <header className="w-full border-b border-border bg-gradient-primary">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base md:text-lg font-semibold">Wicked Works Design Editor</h1>
            <p className="text-xs text-muted-foreground">Advanced editing with gradients, filters, and AI tools</p>
          </div>
          
          {autoSave. enabled && autoSave.lastSaved && (
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Auto-saved {new Date(autoSave.lastSaved).toLocaleTimeString()}</span>
            </div>
          )}
          
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
            <span>History: {historyIndex + 1}/{historyStack.length}</span>
          </div>
        </div>
      </header>
      
      {process.env.NODE_ENV === 'development' && <PerformanceIndicator />}

      <KeyboardShortcutsDialog 
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
        shortcuts={keyboardShortcuts}
      />
      
      <DesignEditorToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onUploadImage={handleUploadImage}
        onExport={() => handleExport("png", 100, `design-${Date.now()}`)}
        onSave={() => setShowSaveDialog(true)}
        onLoad={handleLoad}
        onClear={handleClear}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={() => {
          if (fabricCanvas) {
            const zoom = fabricCanvas. getZoom();
            fabricCanvas.setZoom(Math.min(zoom * 1.1, 20));
            fabricCanvas. renderAll();
          }
        }}
        onZoomOut={() => {
          if (fabricCanvas) {
            const zoom = fabricCanvas.getZoom();
            fabricCanvas.setZoom(Math.max(zoom * 0.9, 0.1));
            fabricCanvas.renderAll();
          }
        }}
        fillColor={fillColor}
        strokeColor={strokeColor}
        onFillColorChange={setFillColor}
        onStrokeColorChange={setStrokeColor}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
      />

      <div className="flex flex-1 overflow-hidden">
        {showPanels && (
          <div className="w-80 border-r bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <Tabs defaultValue="templates" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                  </TabsList>

                 <TabsContent value="tools" className="space-y-4 mt-4">
  <Suspense fallback={<PanelSkeleton />}>
    {/* ...  existing panels ... */}
    
    <StockAssetsPanel 
      onImageSelect={(imageUrl) => {
        if (! fabricCanvas) return;
        FabricImage.fromURL(imageUrl).then((img) => {
          img.scaleToWidth(400);
          img.set({ left: 100, top: 100 });
          img.id = `stock-img-${Date.now()}`;
          img.name = 'Stock Image';
          fabricCanvas.add(img);
          fabricCanvas.renderAll();
        });
      }}
    />
  </Suspense>
</TabsContent>

                  <TabsContent value="tools" className="space-y-4 mt-4">
                    <Suspense fallback={<PanelSkeleton />}>
                      <AdvancedBrushPanel
                        activeTool={activeTool}
                        brushSize={brushSize}
                        brushHardness={brushHardness}
                        brushOpacity={brushOpacity}
                        onBrushSizeChange={setBrushSize}
                        onBrushHardnessChange={setBrushHardness}
                        onBrushOpacityChange={setBrushOpacity}
                        onToolActivate={handleBrushToolActivate}
                        cloneSourceX={cloneSourceX}
                        cloneSourceY={cloneSourceY}
                        onSetCloneSource={handleSetCloneSource}
                      />
                      <SelectionToolsPanel
                        onCropSelection={handleCropSelection}
                        onDeleteSelection={handleDeleteSelection}
                        onExtractSelection={handleExtractSelection}
                        onInvertSelection={handleInvertSelection}
                        featherRadius={featherRadius}
                        onFeatherChange={setFeatherRadius}
                      />
                      <ImageTransformTools
                        onCrop={handleCrop}
                        onResize={handleResize}
                        onRotate={handleRotate}
                        onFlip={handleFlip}
                        currentWidth={canvasWidth}
                        currentHeight={canvasHeight}
                      />
                      <ImageFilters 
                        onApplyFilter={handleApplyFilter}
                        externalFilterValues={aiFilterValues}
                      />
                      <AISuggestionsPanel 
                        canvasContext={{
                          canvasSize: { width: canvasWidth, height:  canvasHeight },
                          objects: fabricCanvas?. getObjects() || [],
                          colors: [fillColor, strokeColor]
                        }}
                        onApplyFilterValues={setAiFilterValues}
                      />
                      <ExportPanel onExport={handleExport} />
                    </Suspense>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-gradient-to-br from-muted/50 to-muted p-8">
          <div className="flex items-center justify-center min-h-full">
            <div className="shadow-2xl rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {showPanels && (
          <DesignEditorLayerPanel
            layers={layers}
            activeLayerId={activeLayerId}
            onLayerSelect={(id) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                fabricCanvas. setActiveObject(obj);
                fabricCanvas. renderAll();
              }
            }}
            onLayerToggleVisible={(id) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                obj.visible = !obj.visible;
                fabricCanvas.renderAll();
                updateLayers(fabricCanvas);
              }
            }}
            onLayerToggleLock={(id) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                obj.selectable = !obj.selectable;
                fabricCanvas.renderAll();
                updateLayers(fabricCanvas);
              }
            }}
            onLayerDelete={(id) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                fabricCanvas.remove(obj);
                fabricCanvas. renderAll();
              }
            }}
            onLayerOpacityChange={(id, opacity) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                obj.opacity = opacity;
                fabricCanvas.renderAll();
                updateLayers(fabricCanvas);
              }
            }}
            onLayerBlendModeChange={(id, mode) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                (obj as any).globalCompositeOperation = mode;
                fabricCanvas.renderAll();
                updateLayers(fabricCanvas);
                toast.success(`Blend mode set to ${mode}`);
              }
            }}
            onLayerFillChange={(id, fill) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                if (obj.fill && typeof obj.fill === 'string') {
                  const color = obj.fill;
                  const rgb = color.match(/\d+/g);
                  if (rgb) {
                    obj.set('fill', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${fill})`);
                  }
                }
                fabricCanvas.renderAll();
                updateLayers(fabricCanvas);
              }
            }}
            onLayerMove={(id, direction) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                const allObjects = fabricCanvas.getObjects();
                const currentIndex = allObjects.indexOf(obj);
                
                if (direction === 'up' && currentIndex < allObjects.length - 1) {
                  fabricCanvas.remove(obj);
                  fabricCanvas.insertAt(currentIndex + 1, obj);
                } else if (direction === 'down' && currentIndex > 0) {
                  fabricCanvas.remove(obj);
                  fabricCanvas.insertAt(currentIndex - 1, obj);
                }
                
                fabricCanvas.renderAll();
                updateLayers(fabricCanvas);
                toast.success(`Layer moved ${direction}`);
              }
            }}
            onLayerDuplicate={async (id) => {
              const obj = fabricCanvas?.getObjects().find((o) => o.id === id);
              if (obj && fabricCanvas) {
                try {
                  const cloned = await obj.clone() as FabricObject;
                  cloned.set({
                    left: (cloned.left || 0) + 20,
                    top: (cloned.top || 0) + 20,
                  });
                  cloned.id = `${obj.id}-copy-${Date.now()}`;
                  cloned.name = `${obj.name} (Copy)`;
                  
                  fabricCanvas.add(cloned);
                  fabricCanvas. setActiveObject(cloned);
                  fabricCanvas.renderAll();
                  toast.success("Layer duplicated");
                } catch (error) {
                  console.error('Layer duplication failed:', error);
                  toast.error("Failed to duplicate layer");
                }
              }
            }}
            onAddLayer={() => {
              if (! fabricCanvas) return;
              const rect = new Rect({
                left: 100,
                top: 100,
                fill: fillColor,
                stroke: strokeColor,
                strokeWidth: 2,
                width: 150,
                height: 150,
              });
              rect.id = `rect-${Date.now()}`;
              rect.name = 'New Rectangle';
              
              fabricCanvas. add(rect);
              fabricCanvas.setActiveObject(rect);
              fabricCanvas.renderAll();
              toast.success("New layer added");
            }}
          />
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Design Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e. target.value)}
                placeholder="My Amazing Design"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && projectName.trim()) {
                    handleSave();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Your project will be saved with all layers and edits
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-md space-y-1">
              <p className="text-xs font-medium">What gets saved:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>All layers and objects</li>
                <li>Colors, filters, and effects</li>
                <li>Text formatting and styles</li>
                <li>Layer order and visibility</li>
                <li>Canvas size and background</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isProcessing || !projectName.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Project'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Load Design Project</DialogTitle>
          </DialogHeader>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileImage className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">No saved projects found</p>
              <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
                Close
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <VirtualizedProjectList 
                projects={projects}
                onProjectClick={loadProject}
              />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}