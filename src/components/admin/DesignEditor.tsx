import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from "react";
import React from "react";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { DesignEditorTooltip } from "./DesignEditorTooltip";
import { DesignEditorMobileWarning } from "./DesignEditorMobileWarning";
import { Canvas as FabricCanvas, FabricObject, Rect, Circle, IText, PencilBrush, FabricImage, filters, Shadow, Polygon, Point, PatternBrush, Ellipse } from "fabric";
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
import { FileImage } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualizedProjectList } from "./VirtualizedProjectList";
import { PerformanceIndicator } from "./PerformanceIndicator";

// Lazy load heavy components for better initial load performance
const ImageFilters = lazy(() => import("./ImageFilters").then(m => ({ default: m.ImageFilters })));
const ImageTransformTools = lazy(() => import("./ImageTransformTools").then(m => ({ default: m.ImageTransformTools })));
const DesignTemplates = lazy(() => import("./DesignTemplates").then(m => ({ default: m.DesignTemplates })));
const TextEffectsPanel = lazy(() => import("./TextEffectsPanel").then(m => ({ default: m.TextEffectsPanel })));
const BackgroundPanel = lazy(() => import("./BackgroundPanel").then(m => ({ default: m.BackgroundPanel })));
const SelectionToolsPanel = lazy(() => import("./SelectionToolsPanel").then(m => ({ default: m.SelectionToolsPanel })));
const AdvancedBrushPanel = lazy(() => import("./AdvancedBrushPanel").then(m => ({ default: m.AdvancedBrushPanel })));
const ShapeToolsPanel = lazy(() => import("./ShapeToolsPanel").then(m => ({ default: m.ShapeToolsPanel })));
const ExportPanel = lazy(() => import("./ExportPanel").then(m => ({ default: m.ExportPanel })));
const AISuggestionsPanel = lazy(() => import("./AISuggestionsPanel").then(m => ({ default: m.AISuggestionsPanel })));

// Loading component for lazy loaded panels
const PanelSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode?: string;
  fill?: number;
}

export function DesignEditor() {
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
  
  // Undo/Redo history stack
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  
  // AI-suggested filter values for auto-apply
  const [aiFilterValues, setAiFilterValues] = useState<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);
    updateLayers(canvas);

    canvas.on("selection:created", () => updateLayers(canvas));
    canvas.on("selection:updated", () => updateLayers(canvas));
    canvas.on("selection:cleared", () => updateLayers(canvas));
    canvas.on("object:added", () => {
      updateLayers(canvas);
      saveToHistory(canvas);
    });
    canvas.on("object:removed", () => {
      updateLayers(canvas);
      saveToHistory(canvas);
    });
    canvas.on("object:modified", () => {
      updateLayers(canvas);
      saveToHistory(canvas);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "brush" || activeTool === "eraser";

    if (fabricCanvas.isDrawingMode && fabricCanvas.freeDrawingBrush) {
      const brush = new PencilBrush(fabricCanvas);
      brush.color = activeTool === "eraser" ? "#ffffff" : fillColor;
      brush.width = brushSize;
      
      // Apply opacity
      const rgba = activeTool === "eraser" 
        ? `rgba(255, 255, 255, ${brushOpacity / 100})`
        : hexToRgba(fillColor, brushOpacity / 100);
      brush.color = rgba;

      fabricCanvas.freeDrawingBrush = brush;
    }

    fabricCanvas.defaultCursor = activeTool === "move" ? "move" : "default";

    // Setup clone stamp or healing brush
    if (activeTool === "clone" || activeTool === "healing") {
      setupAdvancedBrushTool(activeTool);
    }
  }, [activeTool, fillColor, brushSize, fabricCanvas, brushOpacity, brushHardness]);

  // Memoized helper functions
  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  // Debounced layer update to prevent excessive re-renders
  const updateLayers = useCallback((canvas: FabricCanvas) => {
    const objects = canvas.getObjects();
    const newLayers: Layer[] = objects.map((obj, index) => ({
      id: obj.get("id") as string || `layer-${index}`,
      name: obj.get("name") as string || `${obj.get("type")} ${index + 1}`,
      type: obj.get("type") || "object",
      visible: obj.visible ?? true,
      locked: obj.selectable === false,
      opacity: obj.opacity ?? 1,
      blendMode: (obj as any).globalCompositeOperation || 'source-over',
      fill: (obj.fill && typeof obj.fill === 'string') ? 1 : (obj as any).fillOpacity ?? 1,
    }));
    setLayers(newLayers);

    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      setActiveLayerId(activeObj.get("id") as string || null);
    }
  }, []);

  // Memoized tool change handler
  const handleToolChange = useCallback((tool: string) => {
    setActiveTool(tool);
    if (!fabricCanvas) return;

    // Clear any active selection when switching tools
    if (selectionObject) {
      fabricCanvas.remove(selectionObject);
      setSelectionObject(null);
    }

    // Reset lasso state
    setIsDrawingLasso(false);
    setLassoPoints([]);

    // Handle shape tools
    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        width: 200,
        height: 150,
      });
      fabricCanvas.add(rect);
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
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (tool === "text") {
      const text = new IText("Text", {
        left: 100,
        top: 100,
        fill: fillColor,
        fontSize: 32,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
    }

    // Handle selection tools
    if (tool === "marquee") {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "crosshair";
      toast.info("Click and drag to create rectangular selection");
      setupMarqueeSelection();
    } else if (tool === "lasso") {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "crosshair";
      toast.info("Draw freehand selection path");
      setupLassoSelection();
    } else {
      fabricCanvas.selection = tool === "select";
      fabricCanvas.defaultCursor = tool === "move" ? "move" : "default";
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, fillColor, strokeColor, selectionObject]);

  // Memoized upload handler with optimized caching and processing
  const handleUploadImage = useCallback(async (file: File) => {
    if (!fabricCanvas) return;

    // Use server-side processing for large images (> 2MB) with caching
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > 2) {
      toast("Processing large image...");
      try {
        const { optimizeImageForWeb } = await import('@/lib/imageProcessing');
        const result = await optimizeImageForWeb(file);
        
        FabricImage.fromURL(result.processedImage).then((fabricImg) => {
          fabricImg.set({
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
          });
          fabricCanvas.add(fabricImg);
          fabricCanvas.renderAll();
          
          const cacheStatus = result.fromCache ? ' (from cache)' : '';
          toast.success(`Image optimized${cacheStatus} (${Math.round(result.metadata.size / 1024)}KB)`);
        });
      } catch (error) {
        console.error('Image processing error:', error);
        toast.error("Failed to process image. Using original.");
        // Fallback to client-side
        loadImageClientSide(file, fabricCanvas);
      }
    } else {
      // Small images processed client-side with progressive loading
      loadImageClientSide(file, fabricCanvas);
    }
  }, [fabricCanvas]);

  // Helper function for client-side image loading
  const loadImageClientSide = useCallback((file: File, canvas: any) => {
    const reader = new FileReader();
    reader.onloadstart = () => {
      // Show loading indicator
      toast("Loading image...");
    };
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        FabricImage.fromURL(e.target?.result as string).then((fabricImg) => {
          fabricImg.set({
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
          });
          canvas.add(fabricImg);
          canvas.renderAll();
          toast.success("Image loaded");
        });
      };
      img.onerror = () => {
        toast.error("Failed to load image");
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  }, []);

  // Memoized export handler
  const handleExport = useCallback((format: string, quality: number, filename: string) => {
    if (!fabricCanvas) return;

    try {
      let dataURL: string;
      
      if (format === "svg") {
        // Export as SVG
        const svgData = fabricCanvas.toSVG();
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.download = `${filename || 'design'}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success("SVG exported successfully");
        return;
      }

      // Export as raster format (PNG, JPEG, WEBP, GIF)
      dataURL = fabricCanvas.toDataURL({
        format: format === "jpeg" ? "jpeg" : format === "webp" ? "webp" : "png",
        quality: quality / 100,
        multiplier: 2, // Higher resolution
      });

      const link = document.createElement("a");
      link.download = `${filename || 'design'}.${format}`;
      link.href = dataURL;
      link.click();

      toast.success(`Image exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  }, [fabricCanvas]);

  // Memoized save handler
  const handleSave = useCallback(async () => {
    if (!fabricCanvas || !projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const canvasData = fabricCanvas.toJSON();
      const thumbnail = fabricCanvas.toDataURL({ format: "png", quality: 0.5, multiplier: 1 });

      const { error } = await supabase.from("design_projects").insert({
        user_id: user.id,
        name: projectName,
        canvas_data: canvasData,
        thumbnail_url: thumbnail,
        width: fabricCanvas.width || 1200,
        height: fabricCanvas.height || 800,
      });

      if (error) throw error;

      toast.success("Project saved successfully");
      setShowSaveDialog(false);
      setProjectName("");
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [fabricCanvas, projectName]);

  // Memoized load projects handler
  const handleLoad = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("design_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      setShowLoadDialog(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  // Memoized load project handler
  const loadProject = useCallback((project: any) => {
    if (!fabricCanvas) return;

    fabricCanvas.loadFromJSON(project.canvas_data, () => {
      fabricCanvas.renderAll();
      updateLayers(fabricCanvas);
      toast.success("Project loaded successfully");
      setShowLoadDialog(false);
    });
  }, [fabricCanvas, updateLayers]);

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast.success("Canvas cleared");
  };

  const handleUndo = () => {
    // Implement undo functionality
    toast.info("Undo functionality coming soon");
  };

  const handleRedo = () => {
    // Implement redo functionality
    toast.info("Redo functionality coming soon");
  };

  const handleApplyFilter = (filterType: string, value?: number | any) => {
    const activeObj = fabricCanvas?.getActiveObject();
    if (!activeObj || !(activeObj instanceof FabricImage)) {
      toast.error("Please select an image first");
      return;
    }

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
        // Simulate lightness using brightness
        img.filters = [new filters.Brightness({ brightness: (value || 0) / 100 })];
        break;
      case 'blur':
        img.filters = [new filters.Blur({ blur: (value || 0) / 20 })];
        break;
      case 'levels':
        // Apply levels adjustment using a combination of brightness and contrast
        if (value && typeof value === 'object') {
          const { inputShadows, inputMidtones, inputHighlights, outputShadows, outputHighlights } = value;
          
          // Calculate normalized values
          const shadowAdjust = (inputShadows / 255) - 0.5;
          const highlightAdjust = (inputHighlights / 255) - 0.5;
          const midtoneAdjust = (inputMidtones / 128) - 1;
          const outputRange = (outputHighlights - outputShadows) / 255;
          
          // Apply combined brightness and contrast adjustments
          img.filters = [
            new filters.Brightness({ brightness: shadowAdjust + midtoneAdjust }),
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
        img.filters = [new filters.Convolute({
          matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
        })];
        break;
      case 'emboss':
        img.filters = [new filters.Convolute({
          matrix: [-2, -1, 0, -1, 1, 1, 0, 1, 2]
        })];
        break;
      case 'edgeDetect':
        img.filters = [new filters.Convolute({
          matrix: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        })];
        break;
      case 'reset':
        img.filters = [];
        break;
    }

    img.applyFilters();
    fabricCanvas?.renderAll();
    toast.success(`${filterType} filter applied`);
  };

  const handleCrop = () => {
    const activeObj = fabricCanvas?.getActiveObject();
    if (!activeObj || !(activeObj instanceof FabricImage)) {
      toast.error("Please select an image first");
      return;
    }

    toast.info("Use the corner handles to define crop area, then click outside to apply");
    activeObj.set({
      cropX: 0,
      cropY: 0,
    });
    fabricCanvas?.renderAll();
  };

  const handleResize = (width: number, height: number) => {
    if (!fabricCanvas) return;

    fabricCanvas.setDimensions({ width, height });
    setCanvasWidth(width);
    setCanvasHeight(height);
    fabricCanvas.renderAll();
    toast.success("Canvas resized");
  };

  const handleRotate = (angle: number) => {
    const activeObj = fabricCanvas?.getActiveObject();
    if (!activeObj) {
      toast.error("Please select an object first");
      return;
    }

    activeObj.rotate((activeObj.angle || 0) + angle);
    fabricCanvas?.renderAll();
    toast.success(`Rotated ${angle}°`);
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
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
  };

  const handleUpdateText = (options: any) => {
    const activeObj = fabricCanvas?.getActiveObject();
    if (!activeObj || !(activeObj instanceof IText)) {
      toast.error("Please select a text object first");
      return;
    }

    // Update text content
    if (options.textContent !== undefined) {
      activeObj.set('text', options.textContent);
    }

    // Update font properties
    if (options.fontFamily) activeObj.set('fontFamily', options.fontFamily);
    if (options.fontSize) activeObj.set('fontSize', options.fontSize);
    if (options.fontWeight) activeObj.set('fontWeight', options.fontWeight);
    if (options.fontStyle) activeObj.set('fontStyle', options.fontStyle);
    if (options.textAlign) activeObj.set('textAlign', options.textAlign);
    if (options.lineHeight) activeObj.set('lineHeight', options.lineHeight);
    if (options.letterSpacing !== undefined) activeObj.set('charSpacing', options.letterSpacing * 10);

    // Text decoration and transform
    if (options.textDecoration) activeObj.set('underline', options.textDecoration === 'underline');
    if (options.textDecoration === 'line-through') activeObj.set('linethrough', true);
    if (options.textDecoration === 'overline') activeObj.set('overline', true);
    
    // Text transform
    if (options.textTransform) {
      const currentText = activeObj.text || '';
      let transformedText = currentText;
      
      switch (options.textTransform) {
        case 'uppercase':
          transformedText = currentText.toUpperCase();
          break;
        case 'lowercase':
          transformedText = currentText.toLowerCase();
          break;
        case 'capitalize':
          transformedText = currentText.replace(/\b\w/g, l => l.toUpperCase());
          break;
        case 'none':
          // Keep original text
          break;
      }
      
      activeObj.set('text', transformedText);
    }

    // Effects
    if (options.shadow) {
      activeObj.set('shadow', new Shadow({
        color: 'rgba(0,0,0,0.5)',
        blur: 10,
        offsetX: 5,
        offsetY: 5,
      }));
    }

    if (options.stroke) {
      activeObj.set({
        stroke: strokeColor,
        strokeWidth: options.strokeWidth || 2,
      });
    }

    fabricCanvas?.renderAll();
    toast.success("Text updated");
  };

  const handleAddText = () => {
    if (!fabricCanvas) return;

    const text = new IText("New Text", {
      left: 100,
      top: 100,
      fill: fillColor,
      fontSize: 32,
      fontFamily: 'Arial, sans-serif',
      editable: true,
    });
    
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Text layer added - double-click to edit");
  };

  const handleAddShape = (shapeType: string, options: any) => {
    if (!fabricCanvas) return;

    let shape: FabricObject | null = null;

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
          fill: options.fill || fillColor,
          stroke: options.stroke || strokeColor,
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
        });
        break;

      case 'polygon':
      case 'triangle':
        const sides = options.sides || 6;
        const radius = options.radius || 75;
        const points: Point[] = [];
        
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          points.push(
            new Point(
              radius * Math.cos(angle),
              radius * Math.sin(angle)
            )
          );
        }

        shape = new Polygon(points, {
          left: 100,
          top: 100,
          fill: options.fill || fillColor,
          stroke: options.stroke || strokeColor,
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
        });
        break;

      case 'star':
        const starPoints: Point[] = [];
        const outerRadius = options.radius || 75;
        const innerRadius = outerRadius * 0.5;
        const numPoints = (options.sides || 5) * 2;

        for (let i = 0; i < numPoints; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / (numPoints / 2) - Math.PI / 2;
          starPoints.push(
            new Point(
              radius * Math.cos(angle),
              radius * Math.sin(angle)
            )
          );
        }

        shape = new Polygon(starPoints, {
          left: 100,
          top: 100,
          fill: options.fill || fillColor,
          stroke: options.stroke || strokeColor,
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
        });
        break;
    }

    if (shape) {
      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.renderAll();
      toast.success(`${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} added`);
    }
  };

  const handleSetBackground = (type: string, value: string) => {
    if (!fabricCanvas) return;

    fabricCanvas.backgroundColor = value;
    fabricCanvas.renderAll();
    toast.success("Background updated");
  };

  const handleSelectTemplate = (template: any) => {
    if (!fabricCanvas) return;

    fabricCanvas.setDimensions({ width: template.width, height: template.height });
    setCanvasWidth(template.width);
    setCanvasHeight(template.height);
    fabricCanvas.renderAll();
    toast.success(`Template "${template.name}" applied`);
  };

  const setupMarqueeSelection = () => {
    if (!fabricCanvas) return;

    let isDown = false;
    let origX = 0;
    let origY = 0;
    let rect: Rect | null = null;

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
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(rect);
    };

    const onMouseMove = (o: any) => {
      if (!isDown || !rect) return;
      const pointer = fabricCanvas.getPointer(o.e);
      
      if (pointer.x < origX) {
        rect.set({ left: pointer.x });
      }
      if (pointer.y < origY) {
        rect.set({ top: pointer.y });
      }

      rect.set({
        width: Math.abs(origX - pointer.x),
        height: Math.abs(origY - pointer.y),
      });
      fabricCanvas.renderAll();
    };

    const onMouseUp = () => {
      isDown = false;
      if (rect) {
        setSelectionObject(rect);
        toast.success("Selection created. Use Selection Tools panel to manipulate.");
      }
      fabricCanvas.off('mouse:down', onMouseDown);
      fabricCanvas.off('mouse:move', onMouseMove);
      fabricCanvas.off('mouse:up', onMouseUp);
    };

    fabricCanvas.on('mouse:down', onMouseDown);
    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);
  };

  const setupLassoSelection = () => {
    if (!fabricCanvas) return;

    const points: Point[] = [];
    let isDrawing = false;

    const onMouseDown = (o: any) => {
      isDrawing = true;
      const pointer = fabricCanvas.getPointer(o.e);
      points.push(new Point(pointer.x, pointer.y));
    };

    const onMouseMove = (o: any) => {
      if (!isDrawing) return;
      const pointer = fabricCanvas.getPointer(o.e);
      points.push(new Point(pointer.x, pointer.y));

      // Draw the path preview
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
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(polygon);
        setSelectionObject(polygon);
        toast.success("Lasso selection created");
      }
      
      fabricCanvas.off('mouse:down', onMouseDown);
      fabricCanvas.off('mouse:move', onMouseMove);
      fabricCanvas.off('mouse:up', onMouseUp);
    };

    fabricCanvas.on('mouse:down', onMouseDown);
    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);
  };

  // History management
  const saveToHistory = useCallback((canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistoryStack(prev => {
      const newStack = prev.slice(0, historyIndex + 1);
      newStack.push(json);
      if (newStack.length > maxHistorySize) {
        newStack.shift();
        return newStack;
      }
      return newStack;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [historyIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (!fabricCanvas || historyIndex <= 0) {
      toast.error("Nothing to undo");
      return;
    }
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const state = historyStack[newIndex];
    fabricCanvas.loadFromJSON(JSON.parse(state), () => {
      fabricCanvas.renderAll();
      updateLayers(fabricCanvas);
      toast.success("Undo applied");
    });
  }, [fabricCanvas, historyIndex, historyStack]);

  const redo = useCallback(() => {
    if (!fabricCanvas || historyIndex >= historyStack.length - 1) {
      toast.error("Nothing to redo");
      return;
    }
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const state = historyStack[newIndex];
    fabricCanvas.loadFromJSON(JSON.parse(state), () => {
      fabricCanvas.renderAll();
      updateLayers(fabricCanvas);
      toast.success("Redo applied");
    });
  }, [fabricCanvas, historyIndex, historyStack]);

  const handleCropSelection = () => {
    if (!selectionObject || !fabricCanvas) {
      toast.error("No active selection");
      return;
    }

    const bounds = selectionObject.getBoundingRect();
    
    // Create crop overlay
    const cropOverlay = new Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      fill: 'transparent',
      stroke: '#00ff00',
      strokeWidth: 3,
      strokeDashArray: [10, 5],
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: false,
    });

    fabricCanvas.add(cropOverlay);
    fabricCanvas.setActiveObject(cropOverlay);
    fabricCanvas.renderAll();
    
    toast.success("Crop overlay created. Resize and confirm to crop.");
    
    // Listen for crop confirmation (double-click or Enter)
    const confirmCrop = () => {
      const finalBounds = cropOverlay.getBoundingRect();
      fabricCanvas.setDimensions({ width: finalBounds.width, height: finalBounds.height });
      setCanvasWidth(finalBounds.width);
      setCanvasHeight(finalBounds.height);
      
      fabricCanvas.remove(selectionObject);
      fabricCanvas.remove(cropOverlay);
      setSelectionObject(null);
      toast.success("Cropped to selection");
    };
    
    // For now, user can manually adjust and delete overlay
  };

  const handleDeleteSelection = () => {
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
    
    fabricCanvas.add(rect);
    fabricCanvas.remove(selectionObject);
    setSelectionObject(null);
    toast.success("Selection deleted");
  };

  const handleExtractSelection = () => {
    if (!selectionObject || !fabricCanvas) {
      toast.error("No active selection");
      return;
    }

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
      left: selectionObject.left,
      top: selectionObject.top,
      width: selectionObject.width,
      height: selectionObject.height,
    });

    const link = document.createElement("a");
    link.download = `selection-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    toast.success("Selection extracted");
  };

  const handleInvertSelection = () => {
    if (!selectionObject || !fabricCanvas) {
      toast.error("No active selection");
      return;
    }

    // Create inverted selection mask
    const canvasBounds = {
      left: 0,
      top: 0,
      width: fabricCanvas.width || 1200,
      height: fabricCanvas.height || 800
    };

    const selBounds = selectionObject.getBoundingRect();
    
    // Create outer rectangle with hole (inverted selection)
    const invertedMask = new Rect({
      left: canvasBounds.left,
      top: canvasBounds.top,
      width: canvasBounds.width,
      height: canvasBounds.height,
      fill: 'rgba(0, 123, 255, 0.2)',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });

    // Add hole by creating a clip path
    const hole = new Rect({
      left: selBounds.left,
      top: selBounds.top,
      width: selBounds.width,
      height: selBounds.height,
      absolutePositioned: true,
      inverted: true,
    });

    fabricCanvas.remove(selectionObject);
    fabricCanvas.add(invertedMask);
    setSelectionObject(invertedMask);
    toast.success("Selection inverted");
  };

  const setupAdvancedBrushTool = (tool: 'clone' | 'healing') => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const onMouseDown = (o: any) => {
      const pointer = fabricCanvas.getPointer(o.e);
      
      // Alt+Click to set clone source
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
        // Calculate offset from initial click
        const offsetX = pointer.x - lastX;
        const offsetY = pointer.y - lastY;
        
        // Draw cloned area
        ctx.save();
        ctx.globalAlpha = brushOpacity / 100;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, brushSize / 2, 0, 2 * Math.PI);
        ctx.clip();
        
        // Clone from source
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
          console.error("Clone error:", e);
        }
        
        ctx.restore();
      } else if (tool === 'healing') {
        // Healing brush - blur and blend
        ctx.save();
        ctx.globalAlpha = brushOpacity / 100;
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, brushSize / 2, 0, 2 * Math.PI);
        ctx.clip();
        
        try {
          // Sample from slightly offset area for healing effect
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
        
        ctx.restore();
      }

      lastX = pointer.x;
      lastY = pointer.y;
      fabricCanvas.renderAll();
    };

    const onMouseUp = () => {
      isDrawing = false;
    };

    fabricCanvas.on('mouse:down', onMouseDown);
    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);
  };

  const handleSetCloneSource = () => {
    setIsSettingCloneSource(true);
    toast.info("Alt+Click on the canvas to set clone source");
  };

  const handleBrushToolActivate = (tool: 'brush' | 'eraser' | 'clone' | 'healing') => {
    setActiveTool(tool);
  };

  // Define keyboard shortcuts with actual handlers
  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => [
    // File operations
    { key: 's', ctrl: true, action: () => setShowSaveDialog(true), description: 'Save project', category: 'File' },
    { key: 'o', ctrl: true, action: () => setShowLoadDialog(true), description: 'Open project', category: 'File' },
    { key: 'e', ctrl: true, action: () => handleExport("png", 100, `design-${Date.now()}`), description: 'Export image', category: 'File' },
    
    // Editing
    { key: 'z', ctrl: true, action: undo, description: 'Undo', category: 'Edit' },
    { key: 'z', ctrl: true, shift: true, action: redo, description: 'Redo', category: 'Edit' },
    { key: 'Delete', action: () => fabricCanvas?.getActiveObject()?.set({ selectable: false }), description: 'Delete selected', category: 'Edit' },
    
    // Tools
    { key: 'v', action: () => setActiveTool('select'), description: 'Select tool', category: 'Tools' },
    { key: 'b', action: () => setActiveTool('brush'), description: 'Brush tool', category: 'Tools' },
    { key: 'e', action: () => setActiveTool('eraser'), description: 'Eraser tool', category: 'Tools' },
    { key: 't', action: () => setActiveTool('text'), description: 'Text tool', category: 'Tools' },
    { key: 'r', action: () => setActiveTool('rectangle'), description: 'Rectangle tool', category: 'Tools' },
    { key: 'c', action: () => setActiveTool('circle'), description: 'Circle tool', category: 'Tools' },
    
    // View
    { key: '+', ctrl: true, action: () => fabricCanvas?.setZoom((fabricCanvas.getZoom() || 1) * 1.1), description: 'Zoom in', category: 'View' },
    { key: '-', ctrl: true, action: () => fabricCanvas?.setZoom((fabricCanvas.getZoom() || 1) * 0.9), description: 'Zoom out', category: 'View' },
    { key: '0', ctrl: true, action: () => fabricCanvas?.setZoom(1), description: 'Reset zoom', category: 'View' },
    { key: 'h', ctrl: true, action: () => setShowPanels(!showPanels), description: 'Hide/Show panels', category: 'View' },
    
    // Help
    { key: '?', ctrl: true, action: () => setShowShortcutsDialog(true), description: 'Show shortcuts', category: 'Help' },
  ], [fabricCanvas, undo, redo, handleExport, showPanels]);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(keyboardShortcuts);

  return (
    <div className="flex flex-col h-screen bg-background" role="application" aria-label="Wicked Works Design Editor">
      {/* Mobile Warning */}
      <DesignEditorMobileWarning />

      {/* Title Bar */}
      <header className="w-full border-b border-border bg-gradient-primary">
        <div className="px-4 py-3">
          <h1 className="text-base md:text-lg font-semibold">Wicked Works Design Editor</h1>
          <p className="text-xs text-muted-foreground">Advanced editing with gradients, filters, and AI tools</p>
        </div>
      </header>
      
      {/* Performance Indicator (dev mode only) */}
      {process.env.NODE_ENV === 'development' && <PerformanceIndicator />}

      {/* Keyboard Shortcuts Dialog */}
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
        onZoomIn={() => fabricCanvas?.setZoom((fabricCanvas.getZoom() || 1) * 1.1)}
        onZoomOut={() => fabricCanvas?.setZoom((fabricCanvas.getZoom() || 1) * 0.9)}
        fillColor={fillColor}
        strokeColor={strokeColor}
        onFillColorChange={setFillColor}
        onStrokeColorChange={setStrokeColor}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools & Options */}
        <div className="w-80 border-r bg-muted/30">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Tabs defaultValue="templates" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4 mt-4">
                  <Suspense fallback={<PanelSkeleton />}>
                    <DesignTemplates onSelectTemplate={handleSelectTemplate} />
                    <BackgroundPanel onSetBackground={handleSetBackground} />
                    <ShapeToolsPanel 
                      onAddShape={handleAddShape}
                      fillColor={fillColor}
                      strokeColor={strokeColor}
                      onFillColorChange={setFillColor}
                      onStrokeColorChange={setStrokeColor}
                    />
                    <TextEffectsPanel onUpdateText={handleUpdateText} onAddText={handleAddText} />
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
                      canvasSize: { width: canvasWidth, height: canvasHeight },
                      objects: fabricCanvas?.getObjects() || [],
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

        {/* Main Canvas Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-muted/50 to-muted p-8">
          <div className="flex items-center justify-center min-h-full">
            <div className="shadow-2xl rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        <DesignEditorLayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onLayerSelect={(id) => {
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
            if (obj && fabricCanvas) {
              fabricCanvas.setActiveObject(obj);
              fabricCanvas.renderAll();
            }
          }}
          onLayerToggleVisible={(id) => {
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
            if (obj && fabricCanvas) {
              obj.visible = !obj.visible;
              fabricCanvas.renderAll();
              updateLayers(fabricCanvas);
            }
          }}
          onLayerToggleLock={(id) => {
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
            if (obj && fabricCanvas) {
              obj.selectable = !obj.selectable;
              fabricCanvas.renderAll();
              updateLayers(fabricCanvas);
            }
          }}
          onLayerDelete={(id) => {
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
            if (obj && fabricCanvas) {
              fabricCanvas.remove(obj);
              fabricCanvas.renderAll();
            }
          }}
          onLayerOpacityChange={(id, opacity) => {
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
            if (obj && fabricCanvas) {
              obj.opacity = opacity;
              fabricCanvas.renderAll();
              updateLayers(fabricCanvas);
            }
          }}
          onLayerBlendModeChange={(id, mode) => {
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
            if (obj && fabricCanvas) {
              (obj as any).globalCompositeOperation = mode;
              fabricCanvas.renderAll();
              updateLayers(fabricCanvas);
              toast.success(`Blend mode set to ${mode}`);
            }
          }}
          onLayerFillChange={(id, fill) => {
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
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
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
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
            const obj = fabricCanvas?.getObjects().find((o) => o.get("id") === id);
            if (obj && fabricCanvas) {
              const cloned = await obj.clone();
              cloned.set({
                left: (cloned.left || 0) + 20,
                top: (cloned.top || 0) + 20,
              });
              fabricCanvas.add(cloned);
              fabricCanvas.setActiveObject(cloned);
              fabricCanvas.renderAll();
              toast.success("Layer duplicated");
            }
          }}
          onAddLayer={() => {
            if (!fabricCanvas) return;
            const rect = new Rect({
              left: 100,
              top: 100,
              fill: fillColor,
              stroke: strokeColor,
              strokeWidth: 2,
              width: 150,
              height: 150,
            });
            fabricCanvas.add(rect);
            fabricCanvas.setActiveObject(rect);
            fabricCanvas.renderAll();
            toast.success("New layer added");
          }}
        />
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
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Amazing Design"
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
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Load Design Project</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <VirtualizedProjectList 
              projects={projects}
              onProjectClick={loadProject}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
