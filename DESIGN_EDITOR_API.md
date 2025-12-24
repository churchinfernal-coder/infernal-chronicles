# Design Editor API Documentation

## Overview
Comprehensive API documentation for the Infernal Chronicles Design Editor integrated with SuperAdmin.

## Security
All endpoints require admin authentication via Supabase Auth.

### Authentication
Include the JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

## API Endpoints

### Image Management

#### Upload Image
**Endpoint:** `POST /api/images/upload`  
**Edge Function:** `design-image-upload`

Upload an image to the design editor storage.

**Request:**
```typescript
FormData {
  file: File;
  projectName?: string;
}
```

**Response:**
```typescript
{
  imageId: string;
  imageUrl: string;
  fileName: string;
  size: number;
  contentType: string;
}
```

**Example:**
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('projectName', 'my-project');

const { data } = await supabase.functions.invoke('design-image-upload', {
  body: formData
});
```

#### Process Image
**Endpoint:** `POST /api/images/process`  
**Edge Function:** `process-image`

Process an image with various operations (resize, filters, format conversion).

**Request:**
```typescript
{
  imageUrl?: string;
  imageData?: string; // base64
  operations: {
    resize?: {
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill';
    };
    quality?: number; // 0-100
    format?: 'jpeg' | 'png' | 'webp';
    filters?: {
      brightness?: number; // -100 to 100
      contrast?: number; // -100 to 100
      saturation?: number; // -100 to 100
      blur?: number; // 0-100
    };
  };
}
```

**Response:**
```typescript
{
  processedImage: string; // base64 data URL
  metadata: {
    originalWidth: number;
    originalHeight: number;
    processedWidth: number;
    processedHeight: number;
    format: string;
    size: number;
  };
  fromCache?: boolean;
}
```

**Example:**
```javascript
const { data } = await supabase.functions.invoke('process-image', {
  body: {
    imageUrl: 'https://example.com/image.jpg',
    operations: {
      resize: { width: 800, height: 600, fit: 'contain' },
      quality: 85,
      format: 'webp',
      filters: {
        brightness: 10,
        contrast: 20
      }
    }
  }
});
```

### Layer Management

#### Add Layer
**Endpoint:** `POST /api/images/:imageId/layers`  
**Edge Function:** `design-layer-management`

Add a new layer to an image project.

**Request:**
```typescript
{
  action: 'add';
  imageId: string;
  layerData: {
    type: 'shape' | 'text' | 'image' | 'effect';
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    // Additional layer-specific data
  };
}
```

**Response:**
```typescript
{
  layerId: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  createdAt: string;
  createdBy: string;
}
```

#### Update Layer
**Endpoint:** `PUT /api/images/:imageId/layers/:layerId`  
**Edge Function:** `design-layer-management`

Update an existing layer.

**Request:**
```typescript
{
  action: 'update';
  imageId: string;
  layerId: string;
  layerData: Partial<Layer>;
}
```

**Response:**
```typescript
{
  layerId: string;
  // Updated layer data
  updatedAt: string;
  updatedBy: string;
}
```

#### Delete Layer
**Endpoint:** `DELETE /api/images/:imageId/layers/:layerId`  
**Edge Function:** `design-layer-management`

Delete a layer from an image project.

**Request:**
```typescript
{
  action: 'delete';
  imageId: string;
  layerId: string;
}
```

**Response:**
```typescript
{
  layerId: string;
  deleted: true;
  deletedAt: string;
  deletedBy: string;
}
```

**Example:**
```javascript
// Add layer
const { data: newLayer } = await supabase.functions.invoke('design-layer-management', {
  body: {
    action: 'add',
    imageId: 'project-123',
    layerData: {
      type: 'text',
      name: 'Title Layer',
      visible: true,
      locked: false,
      opacity: 1
    }
  }
});

// Update layer
const { data: updatedLayer } = await supabase.functions.invoke('design-layer-management', {
  body: {
    action: 'update',
    imageId: 'project-123',
    layerId: newLayer.layerId,
    layerData: {
      opacity: 0.8,
      visible: false
    }
  }
});

// Delete layer
const { data: deletedLayer } = await supabase.functions.invoke('design-layer-management', {
  body: {
    action: 'delete',
    imageId: 'project-123',
    layerId: newLayer.layerId
  }
  }
});
```

## Client-Side Integration

### Using Image Processing Hook

```typescript
import { useImageOptimization } from '@/hooks/useImageOptimization';

function MyComponent() {
  const {
    processedImage,
    isProcessing,
    error,
    metadata,
    fromCache,
    optimize,
    reset,
    getCacheStats,
    clearCache
  } = useImageOptimization({
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'webp'
  });

  const handleImageUpload = async (file: File) => {
    await optimize(file, {
      resize: { width: 800, fit: 'contain' },
      filters: { brightness: 10 }
    });
  };

  return (
    <div>
      {isProcessing && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      {processedImage && (
        <img src={processedImage} alt="Processed" />
      )}
      {fromCache && <Badge>From Cache</Badge>}
    </div>
  );
}
```

### Keyboard Shortcuts

The Design Editor includes comprehensive keyboard shortcuts:

**File Operations:**
- `Ctrl+S` - Save project
- `Ctrl+O` - Open project
- `Ctrl+E` - Export image

**Editing:**
- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo
- `Delete` - Delete selected object

**Tools:**
- `V` - Select tool
- `B` - Brush tool
- `E` - Eraser tool
- `T` - Text tool
- `R` - Rectangle tool
- `C` - Circle tool

**View:**
- `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out
- `Ctrl+0` - Reset zoom
- `Ctrl+H` - Hide/Show panels

**Help:**
- `Ctrl+?` - Show shortcuts dialog

## Performance Optimization

### Caching Strategy
The system implements multi-layer caching:

1. **Memory Cache (50MB limit)**
   - Instant cache hits
   - LRU eviction
   - First-layer lookup

2. **IndexedDB Cache (Persistent)**
   - 7-day expiry
   - Survives page reloads
   - Second-layer lookup

### Cache Statistics
```typescript
import { imageCache } from '@/lib/imageCache';

const stats = await imageCache.getStats();
console.log({
  memoryCacheSizeMB: stats.memoryCacheSizeMB,
  memoryCacheItems: stats.memoryCacheItems,
  dbCacheItems: stats.dbCacheItems
});
```

### Clear Cache
```typescript
await imageCache.clear();
```

## Accessibility Features

### ARIA Labels
All interactive elements include proper ARIA labels:
- Canvas: `role="application"` with `aria-label="Design Editor"`
- Tool panels: `role="complementary"` with descriptive labels
- Dialogs: Proper dialog semantics with focus management

### Keyboard Navigation
- Full keyboard navigation support
- Tab order follows logical flow
- Escape key closes dialogs
- Enter activates primary actions

### Screen Reader Support
- Descriptive labels for all tools
- Status announcements for operations
- Contextual help text

## Mobile Optimization

### Responsive Design
- Adaptive layout for mobile/tablet/desktop
- Touch-friendly controls (minimum 44x44px hit targets)
- Optimized toolbar for smaller screens
- Collapsible panels

### Touch Gestures
- Pinch to zoom
- Two-finger pan
- Long press for context menu
- Swipe to switch tools (mobile)

### Performance
- Progressive image loading
- Lazy-loaded components
- Optimized rendering for low-end devices
- Reduced motion support

## Cross-Browser Compatibility

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Feature Detection
The editor gracefully degrades on unsupported browsers:
- Canvas API fallback
- WebGL detection
- IndexedDB availability check
- Service Worker optional enhancement

## Error Handling

### Client-Side Errors
```typescript
try {
  await optimize(file);
} catch (error) {
  if (error.message.includes('File too large')) {
    // Handle file size error
  } else if (error.message.includes('Unsupported format')) {
    // Handle format error
  }
}
```

### Server-Side Errors
API responses include error details:
```typescript
{
  error: string;
  details?: string;
  code?: 'UNAUTHORIZED' | 'INVALID_INPUT' | 'PROCESSING_FAILED';
}
```

## Best Practices

### Image Upload
1. Validate file size client-side (< 20MB)
2. Check file type before upload
3. Show upload progress
4. Handle errors gracefully

### Layer Management
1. Limit active layers to 50 for performance
2. Group related layers
3. Name layers descriptively
4. Lock background layers

### Performance
1. Use WebP format when possible
2. Enable caching for frequently used images
3. Lazy-load large tool panels
4. Debounce intensive operations

### Security
1. Always verify admin role server-side
2. Sanitize all file inputs
3. Validate image dimensions and size
4. Log all admin actions

## Examples

### Complete Workflow
```typescript
// 1. Upload image
const formData = new FormData();
formData.append('file', imageFile);
const { data: uploaded } = await supabase.functions.invoke('design-image-upload', {
  body: formData
});

// 2. Process image
const { data: processed } = await supabase.functions.invoke('process-image', {
  body: {
    imageUrl: uploaded.imageUrl,
    operations: {
      resize: { width: 1200, fit: 'contain' },
      format: 'webp',
      quality: 90
    }
  }
});

// 3. Add layers
const { data: textLayer } = await supabase.functions.invoke('design-layer-management', {
  body: {
    action: 'add',
    imageId: uploaded.imageId,
    layerData: {
      type: 'text',
      name: 'Title',
      content: 'My Design',
      visible: true
    }
  }
});

// 4. Export final result
// (handled by client-side canvas export)
```

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review edge function logs in Supabase dashboard
- Verify admin role is properly configured
- Check browser console for client-side errors

## Changelog

### Version 1.0.0 (2025-10-17)
- Initial release
- Image upload and processing
- Layer management system
- Keyboard shortcuts
- Multi-layer caching
- Mobile optimization
- Accessibility features
- Cross-browser support
