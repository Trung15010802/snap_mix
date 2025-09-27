import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Trash2, Edit, Type, PenTool, Upload, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

// Type definitions
interface TextObject {
  text: string
  x: number
  y: number
  fontSize: number
  color: string
}

interface Position {
  x: number
  y: number
}

type Tool = 'pen' | 'text' | null

interface CanvasProps {
  id?: string
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
}

// Custom hooks với proper TypeScript types
const useCanvasSetup = (onCanvasReady?: (canvas: HTMLCanvasElement) => void) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    setCtx(context)

    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = window.innerHeight * 0.7
    }

    // White background
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)

    if (onCanvasReady) onCanvasReady(canvas)
  }, [onCanvasReady])

  return { canvasRef, ctx }
}

const useCanvasResize = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  ctx: CanvasRenderingContext2D | null,
  image: HTMLImageElement | null,
  texts: TextObject[],
  drawAll: () => void
) => {
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas || !ctx) return
      
      // Save current canvas content
      const tmp = document.createElement('canvas')
      const tctx = tmp.getContext('2d')
      if (!tctx) return
      
      tmp.width = canvas.width
      tmp.height = canvas.height
      tctx.drawImage(canvas, 0, 0)
      
      // Resize canvas
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = window.innerHeight * 0.7
      }
      
      // Restore content
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(tmp, 0, 0)
      drawAll()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [ctx, image, texts, drawAll, canvasRef])
}

const useKeyboardShortcuts = (
  selectedTextIndex: number | null,
  texts: TextObject[],
  setTexts: React.Dispatch<React.SetStateAction<TextObject[]>>,
  setSelectedTextIndex: React.Dispatch<React.SetStateAction<number | null>>,
  closeTextInput: () => void,
  canvasRef: React.RefObject<HTMLCanvasElement>
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = canvasRef.current
      if (!canvas || document.activeElement !== canvas) return

      if (e.key === 'Delete' && selectedTextIndex !== null) {
        setTexts(prev => prev.filter((_, i) => i !== selectedTextIndex))
        setSelectedTextIndex(null)
      }
      if (e.key === 'Escape') {
        closeTextInput()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTextIndex, texts, setTexts, setSelectedTextIndex, closeTextInput, canvasRef])
}

const useImagePaste = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  loadImage: (url: string) => void
) => {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const canvas = canvasRef.current
      if (!canvas || document.activeElement !== canvas) return

      try {
        const items = e.clipboardData?.items
        if (!items) return

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type && item.type.indexOf('image') !== -1) {
            const file = item.getAsFile()
            if (file) {
              loadImage(URL.createObjectURL(file))
              e.preventDefault()
              return
            }
          }
        }
      } catch (err) {
        console.error('Paste error:', err)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [canvasRef, loadImage])
}

const Canvas: React.FC<CanvasProps> = ({ id = 'canvas', onCanvasReady }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  
  // Canvas setup
  const { canvasRef, ctx } = useCanvasSetup(onCanvasReady)
  
  // Canvas focus state
  const [isFocused, setIsFocused] = useState<boolean>(false)
  
  // Drawing states
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [tool, setTool] = useState<Tool>(null)
  
  // Pen settings
  const [penColor, setPenColor] = useState<string>('#000000')
  const [penSize, setPenSize] = useState<number>(5)
  
  // Text settings
  const [textColor, setTextColor] = useState<string>('#000000')
  const [fontSize, setFontSize] = useState<number>(20)
  const [texts, setTexts] = useState<TextObject[]>([])
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null)
  
  // Text input states
  const [textInput, setTextInput] = useState<string>('')
  const [showTextInput, setShowTextInput] = useState<boolean>(false)
  const [textPosition, setTextPosition] = useState<Position>({ x: 0, y: 0 })
  const [isEditingText, setIsEditingText] = useState<boolean>(false)
  
  // Drag states
  const [isDraggingText, setIsDraggingText] = useState<boolean>(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  
  // Image states
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [hasImage, setHasImage] = useState<boolean>(false)

  // Color options
  const colorOptions: string[] = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']

  // Drawing functions
  const drawAll = useCallback(() => {
    if (!ctx || !canvasRef.current) return
    
    const canvas = canvasRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw image if exists
    if (image) {
      const ratio = Math.min(canvas.width / image.width, canvas.height / image.height)
      const centerX = (canvas.width - image.width * ratio) / 2
      const centerY = (canvas.height - image.height * ratio) / 2
      ctx.drawImage(image, 0, 0, image.width, image.height, centerX, centerY, image.width * ratio, image.height * ratio)
    }

    // Draw texts
    texts.forEach((text, index) => {
      ctx.font = `${text.fontSize}px Arial`
      ctx.fillStyle = text.color
      ctx.fillText(text.text, text.x, text.y)

      // Draw selection border
      if (index === selectedTextIndex) {
        const width = ctx.measureText(text.text).width
        ctx.save()
        ctx.strokeStyle = 'blue'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(text.x - 2, text.y - text.fontSize - 2, width + 4, text.fontSize + 4)
        ctx.restore()
      }
    })
  }, [ctx, texts, image, selectedTextIndex, canvasRef])

  // Helper functions
  const getTextIndexAt = useCallback((x: number, y: number): number | null => {
    if (!ctx) return null
    
    for (let i = texts.length - 1; i >= 0; i--) {
      const text = texts[i]
      ctx.font = `${text.fontSize}px Arial`
      const width = ctx.measureText(text.text).width
      const height = text.fontSize
      
      if (x >= text.x && x <= text.x + width && y <= text.y && y >= text.y - height) {
        return i
      }
    }
    return null
  }, [ctx, texts])

  const closeTextInput = useCallback(() => {
    setShowTextInput(false)
    setTool(null)
    setIsEditingText(false)
    setTextInput('')
  }, [])

  const loadImage = useCallback((url: string) => {
    const img = new Image()
    img.onload = () => {
      if (!ctx || !canvasRef.current) return
      setImage(img)
      setHasImage(true)
      drawAll()
    }
    img.onerror = () => {
      alert('Không thể tải ảnh. Vui lòng thử lại.')
    }
    img.src = url
  }, [ctx, drawAll, canvasRef])

  // Pen drawing functions
  const startPenDrawing = useCallback((x: number, y: number) => {
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }, [ctx])

  const drawPenLine = useCallback((x: number, y: number) => {
    if (!ctx || !isDrawing) return
    ctx.lineTo(x, y)
    ctx.strokeStyle = penColor
    ctx.lineWidth = penSize
    ctx.lineCap = 'round'
    ctx.stroke()
  }, [ctx, isDrawing, penColor, penSize])

  const endPenDrawing = useCallback(() => {
    if (!ctx) return
    try { 
      ctx.closePath() 
    } catch (err) {
      // Ignore closePath errors
    }
    setIsDrawing(false)
  }, [ctx])

  // Text functions
  const addTextAt = useCallback((x: number, y: number, text: string, fSize: number = fontSize, color: string = textColor) => {
    const newText: TextObject = { text, x, y, fontSize: fSize, color }
    setTexts(prev => [...prev, newText])
    setSelectedTextIndex(texts.length)
  }, [fontSize, textColor, texts.length])

  const confirmAddText = useCallback(() => {
    const trimmed = textInput?.trim() ?? ''
    if (!trimmed) {
      closeTextInput()
      return
    }

    if (isEditingText && selectedTextIndex !== null) {
      setTexts(prev => {
        const copy = [...prev]
        copy[selectedTextIndex] = {
          ...copy[selectedTextIndex],
          text: trimmed,
          fontSize,
          color: textColor
        }
        return copy
      })
    } else {
      addTextAt(textPosition.x, textPosition.y, trimmed, fontSize, textColor)
    }

    closeTextInput()
  }, [textInput, isEditingText, selectedTextIndex, fontSize, textColor, textPosition, addTextAt, closeTextInput])

  const deleteSelectedText = useCallback(() => {
    if (selectedTextIndex !== null) {
      setTexts(prev => prev.filter((_, i) => i !== selectedTextIndex))
      setSelectedTextIndex(null)
    }
  }, [selectedTextIndex])

  const editSelectedText = useCallback(() => {
    if (selectedTextIndex === null) return
    
    const selectedText = texts[selectedTextIndex]
    setTextInput(selectedText.text)
    setTextPosition({ x: selectedText.x, y: selectedText.y })
    setIsEditingText(true)
    setTool('text')
    setShowTextInput(true)
    setFontSize(selectedText.fontSize)
    setTextColor(selectedText.color)
    
    setTimeout(() => textInputRef.current?.focus(), 100)
  }, [selectedTextIndex, texts])

  // Event handlers
  const handleCanvasFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleCanvasBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    // Focus canvas when clicked
    canvasRef.current.focus()
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'pen') {
      startPenDrawing(x, y)
      return
    }

    const clickedIndex = getTextIndexAt(x, y)
    if (clickedIndex !== null) {
      setSelectedTextIndex(clickedIndex)
      setIsDraggingText(true)
      setDragOffset({ x: x - texts[clickedIndex].x, y: y - texts[clickedIndex].y })
      return
    }

    if (tool === 'text') {
      setSelectedTextIndex(null)
      setTextPosition({ x, y })

      if (textInput && textInput.trim().length > 0) {
        addTextAt(x, y, textInput, fontSize, textColor)
        setTextInput('')
        setShowTextInput(false)
        setTool(null)
        setIsEditingText(false)
      } else {
        setShowTextInput(true)
        setIsEditingText(false)
        setTimeout(() => textInputRef.current?.focus(), 100)
      }
      return
    }

    setSelectedTextIndex(null)
  }, [tool, getTextIndexAt, texts, textInput, fontSize, textColor, startPenDrawing, addTextAt])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'pen' && isDrawing) {
      drawPenLine(x, y)
      return
    }

    if (isDraggingText && selectedTextIndex !== null) {
      setTexts(prev => {
        const copy = [...prev]
        copy[selectedTextIndex] = {
          ...copy[selectedTextIndex],
          x: x - dragOffset.x,
          y: y - dragOffset.y
        }
        return copy
      })
    }
  }, [tool, isDrawing, isDraggingText, selectedTextIndex, dragOffset, drawPenLine])

  const handleMouseUp = useCallback(() => {
    if (tool === 'pen' && isDrawing) {
      endPenDrawing()
    }
    setIsDraggingText(false)
  }, [tool, isDrawing, endPenDrawing])

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const idx = getTextIndexAt(x, y)
    
    if (idx !== null) {
      editSelectedText()
    }
  }, [getTextIndexAt, editSelectedText])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    loadImage(URL.createObjectURL(file))
  }, [loadImage])

  const saveCanvas = useCallback(() => {
    if (!canvasRef.current) return
    
    const link = document.createElement('a')
    link.download = `canvas-drawing-${id}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }, [id])

  // Initialize text position
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      setTextPosition({
        x: canvas.width / 2,
        y: canvas.height / 2,
      })
    }
  }, [])

  // Use custom hooks
  useCanvasResize(canvasRef, ctx, image, texts, drawAll)
  useKeyboardShortcuts(selectedTextIndex, texts, setTexts, setSelectedTextIndex, closeTextInput, canvasRef)
  useImagePaste(canvasRef, loadImage)

  // Redraw when state changes
  useEffect(() => {
    drawAll()
  }, [drawAll])

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Canvas title */}
      <div className="flex items-center justify-between">
        {isFocused && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
            Đang focus - Paste ảnh ở đây
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Button 
            variant={tool === 'pen' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setTool('pen')}
            className="flex items-center gap-2"
          >
            <PenTool size={16} />
            Bút vẽ
          </Button>
          
          <Button 
            variant={tool === 'text' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => { setTool('text'); setShowTextInput(true); setIsEditingText(false); }}
            className="flex items-center gap-2"
          >
            <Type size={16} />
            Thêm Text
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            Tải ảnh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={saveCanvas}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Lưu ảnh
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Text controls */}
        {selectedTextIndex !== null && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
            <span className="text-sm font-medium">Text đã chọn:</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={editSelectedText}
              className="flex items-center gap-1"
            >
              <Edit size={14} />
              Sửa
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={deleteSelectedText}
              className="flex items-center gap-1"
            >
              <Trash2 size={14} />
              Xóa
            </Button>
          </div>
        )}

        {/* Tool-specific controls */}
        {tool === 'pen' && (
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Màu:</span>
              <div className="flex gap-1">
                {colorOptions.map((color) => (
                  <div
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full cursor-pointer border-2",
                      penColor === color ? "border-gray-800" : "border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setPenColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Nét: {penSize}px</span>
              <Slider
                value={[penSize]}
                min={1}
                max={20}
                step={1}
                onValueChange={(value) => setPenSize(value[0])}
                className="w-24"
              />
            </div>
          </div>
        )}

        {tool === 'text' && (
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Màu:</span>
              <div className="flex gap-1">
                {colorOptions.map((color) => (
                  <div
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full cursor-pointer border-2",
                      textColor === color ? "border-gray-800" : "border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setTextColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Cỡ chữ: {fontSize}px</span>
              <Slider
                value={[fontSize]}
                min={12}
                max={72}
                step={1}
                onValueChange={(value) => setFontSize(value[0])}
                className="w-24"
              />
            </div>
          </div>
        )}
      </div>

      {/* Text input */}
      {showTextInput && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Nhập text..."
            className="flex-1 h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAddText()
              if (e.key === 'Escape') closeTextInput()
            }}
          />
          <Button size="sm" onClick={confirmAddText}>
            {isEditingText ? 'Cập nhật' : 'Thêm'}
          </Button>
          <Button size="sm" variant="outline" onClick={closeTextInput}>
            Hủy
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div className="canvas-container relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
        {!hasImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 pointer-events-none bg-gray-50">
            <p className="text-lg font-medium mb-2">Click để focus, rồi paste ảnh (Ctrl+V)</p>
            <p className="text-sm">Hoặc tải ảnh bằng nút "Tải ảnh"</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          id={id}
          className={cn(
            "w-full h-full cursor-crosshair outline-none",
            isFocused ? "ring-2 ring-blue-500" : ""
          )}
          tabIndex={0}
          onFocus={handleCanvasFocus}
          onBlur={handleCanvasBlur}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    </div>
  )
}

export default Canvas