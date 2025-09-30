import React from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Trash2, Edit, Type, PenTool, Upload, Save, Combine } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CanvasToolbarProps {
  // Current active tab
  activeTab: 'single' | 'dual'
  
  // Tool states
  tool: 'pen' | 'text' | null
  setTool: (tool: 'pen' | 'text' | null) => void
  
  // Pen settings
  penColor: string
  setPenColor: (color: string) => void
  penSize: number
  setPenSize: (size: number) => void
  
  // Text settings
  textColor: string
  setTextColor: (color: string) => void
  fontSize: number
  setFontSize: (size: number) => void
  
  // Selected text actions
  selectedTextIndex: number | null
  editSelectedText: () => void
  deleteSelectedText: () => void
  
  // File actions
  onUploadImage: () => void
  onSaveCanvas: () => void
  
  // Dual canvas actions
  onMergeImages?: () => void
}

const colorOptions = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF']

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTab,
  tool,
  setTool,
  penColor,
  setPenColor,
  penSize,
  setPenSize,
  textColor,
  setTextColor,
  fontSize,
  setFontSize,
  selectedTextIndex,
  editSelectedText,
  deleteSelectedText,
  onUploadImage,
  onSaveCanvas,
  onMergeImages
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Main tools */}
      <div className="flex items-center gap-1">
        <Button 
          variant={tool === 'pen' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setTool('pen')}
          className="flex items-center gap-1 text-xs"
        >
          <PenTool size={14} />
          Bút vẽ
        </Button>
        
        <Button 
          variant={tool === 'text' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setTool('text')}
          className="flex items-center gap-1 text-xs"
        >
          <Type size={14} />
          Text
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUploadImage}
          className="flex items-center gap-1 text-xs"
        >
          <Upload size={14} />
          Tải ảnh
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSaveCanvas}
          className="flex items-center gap-1 text-xs"
        >
          <Save size={14} />
          Lưu
        </Button>
      </div>

      {/* Dual canvas specific tools */}
      {activeTab === 'dual' && onMergeImages && (
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={onMergeImages}
            className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700"
          >
            <Combine size={14} />
            Ghép ảnh
          </Button>
        </div>
      )}

      {/* Selected text actions */}
      {selectedTextIndex !== null && (
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={editSelectedText}
            className="flex items-center gap-1 text-xs"
          >
            <Edit size={12} />
            Sửa
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={deleteSelectedText}
            className="flex items-center gap-1 text-xs"
          >
            <Trash2 size={12} />
            Xóa
          </Button>
        </div>
      )}

      {/* Tool settings */}
      {tool === 'pen' && (
        <div className="flex items-center gap-2 border-l pl-2 ml-2">
          <div className="flex gap-1">
            {colorOptions.slice(0, 4).map((color) => (
              <div
                key={color}
                className={cn(
                  "w-4 h-4 rounded-full cursor-pointer border",
                  penColor === color ? "border-gray-800 border-2" : "border-gray-300"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setPenColor(color)}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs">{penSize}px</span>
            <Slider
              value={[penSize]}
              min={1}
              max={20}
              step={1}
              onValueChange={(value) => setPenSize(value[0])}
              className="w-16"
            />
          </div>
        </div>
      )}

      {tool === 'text' && (
        <div className="flex items-center gap-2 border-l pl-2 ml-2">
          <div className="flex gap-1">
            {colorOptions.slice(0, 4).map((color) => (
              <div
                key={color}
                className={cn(
                  "w-4 h-4 rounded-full cursor-pointer border",
                  textColor === color ? "border-gray-800 border-2" : "border-gray-300"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setTextColor(color)}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs">{fontSize}px</span>
            <Slider
              value={[fontSize]}
              min={12}
              max={72}
              step={1}
              onValueChange={(value) => setFontSize(value[0])}
              className="w-16"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default CanvasToolbar