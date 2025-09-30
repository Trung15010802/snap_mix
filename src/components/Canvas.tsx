import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
// import { Trash2, Edit, Type, PenTool, Upload, Save } from 'lucide-react' (unused)
// import { cn } from '@/lib/utils' (unused)

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
  // Tool states from parent
  tool?: 'pen' | 'text' | null
  onToolChange?: (tool: 'pen' | 'text' | null) => void
  // Pen settings
  penColor?: string
  onPenColorChange?: (color: string) => void
  penSize?: number
  onPenSizeChange?: (size: number) => void
  // Text settings
  textColor?: string
  onTextColorChange?: (color: string) => void
  fontSize?: number
  onFontSizeChange?: (size: number) => void
  // Selected text
  selectedTextIndex?: number | null
  onSelectedTextChange?: (index: number | null) => void
  // Text input
  showTextInput?: boolean
  onShowTextInputChange?: (show: boolean) => void
  isEditingText?: boolean
  onIsEditingTextChange?: (editing: boolean) => void
  // Actions
  onUploadImage?: () => void
  onSaveCanvas?: () => void
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
  setSelectedTextIndex: (index: number | null) => void,
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

const Canvas: React.FC<CanvasProps> = ({ 
  // id = 'canvas', (unused)
  onCanvasReady,
  // Tool states from parent
  tool: externalTool,
  onToolChange,
  // Pen settings
  penColor: externalPenColor,
  // onPenColorChange, (unused)
  penSize: externalPenSize,
  // onPenSizeChange, (unused)
  // Text settings
  textColor: externalTextColor,
  // onTextColorChange, (unused)
  fontSize: externalFontSize,
  // onFontSizeChange, (unused)
  // Selected text
  selectedTextIndex: externalSelectedTextIndex,
  onSelectedTextChange,
  // Text input
  showTextInput: externalShowTextInput,
  onShowTextInputChange,
  isEditingText: externalIsEditingText,
  onIsEditingTextChange,
  // Actions
  // onUploadImage: externalOnUploadImage, (unused)
  // onSaveCanvas: externalOnSaveCanvas (unused)
}) => {
  // Color palette for text
  const colorPalette = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
    '#808080', // Gray
    '#90EE90', // Light Green
    '#87CEEB', // Sky Blue
    '#DDA0DD'  // Plum
  ]

  // const fileInputRef = useRef<HTMLInputElement>(null) (unused)
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  
  // Canvas setup
  const { canvasRef, ctx } = useCanvasSetup(onCanvasReady)
  
  // Use external states if provided, otherwise use internal states
  const [internalTool, setInternalTool] = useState<Tool>(null)
  // const [internalPenColor, setInternalPenColor] = useState<string>('#000000') (unused)
  // const [internalPenSize, setInternalPenSize] = useState<number>(5) (unused)
  // const [internalTextColor, setInternalTextColor] = useState<string>('#000000') (unused)
  // const [internalFontSize, setInternalFontSize] = useState<number>(20) (unused)
  const [internalSelectedTextIndex, setInternalSelectedTextIndex] = useState<number | null>(null)
  const [internalShowTextInput, setInternalShowTextInput] = useState<boolean>(false)
  const [internalIsEditingText, setInternalIsEditingText] = useState<boolean>(false)

  // Use external props if available, otherwise use internal state
  const tool = externalTool !== undefined ? externalTool : internalTool
  const setTool = onToolChange || setInternalTool
  const penColor = externalPenColor !== undefined ? externalPenColor : '#000000'
  // const setPenColor = onPenColorChange || setInternalPenColor (unused)
  const penSize = externalPenSize !== undefined ? externalPenSize : 5
  // const setPenSize = onPenSizeChange || setInternalPenSize (unused)
  const textColor = externalTextColor !== undefined ? externalTextColor : '#000000'
  // const setTextColor = onTextColorChange || setInternalTextColor (unused)
  const fontSize = externalFontSize !== undefined ? externalFontSize : 20
  // const setFontSize = onFontSizeChange || setInternalFontSize (unused)
  const selectedTextIndex = externalSelectedTextIndex !== undefined ? externalSelectedTextIndex : internalSelectedTextIndex
  const setSelectedTextIndex = onSelectedTextChange || setInternalSelectedTextIndex
  const showTextInput = externalShowTextInput !== undefined ? externalShowTextInput : internalShowTextInput
  const setShowTextInput = onShowTextInputChange || setInternalShowTextInput
  const isEditingText = externalIsEditingText !== undefined ? externalIsEditingText : internalIsEditingText
  const setIsEditingText = onIsEditingTextChange || setInternalIsEditingText

  // Canvas focus state
  const [isFocused, setIsFocused] = useState<boolean>(false)
  
  // Drawing states
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  
  // Other internal states
  const [texts, setTexts] = useState<TextObject[]>([])
  const [textInput, setTextInput] = useState<string>('')
  const [textPosition, setTextPosition] = useState<Position>({ x: 0, y: 0 })
  const [dialogTextColor, setDialogTextColor] = useState<string>('#000000')
  const [dialogFontSize, setDialogFontSize] = useState<number>(16)
  
  // Drag states
  const [isDraggingText, setIsDraggingText] = useState<boolean>(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  
  // Image states
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  // const [hasImage, setHasImage] = useState<boolean>(false) (unused)
  
  // Color options for pen
  // const colorOptions: string[] = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'] (unused)

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
      // setHasImage(true) (unused)
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

  // ...existing code ...
  // const openTextInput = useCallback((x: number, y: number) => {
  //   setTextPosition({ x, y })
  //   setTextInput('')
  //   setIsEditingText(false)
  //   setShowTextInput(true)
  //   // Set dialog values from current header values or defaults
  //   setDialogTextColor(textColor)
  //   setDialogFontSize(fontSize)
  //   setTimeout(() => textInputRef.current?.focus(), 100)
  // }, [textColor, fontSize]) (unused)

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
          fontSize: dialogFontSize,
          color: dialogTextColor
        }
        return copy
      })
    } else {
      addTextAt(textPosition.x, textPosition.y, trimmed, dialogFontSize, dialogTextColor)
    }

    closeTextInput()
  }, [textInput, isEditingText, selectedTextIndex, dialogFontSize, dialogTextColor, textPosition, addTextAt, closeTextInput])

  // const deleteSelectedText = useCallback(() => {
  //   if (selectedTextIndex !== null) {
  //     setTexts(prev => prev.filter((_, i) => i !== selectedTextIndex))
  //     setSelectedTextIndex(null)
  //   }
  // }, [selectedTextIndex]) (unused)

  const editSelectedText = useCallback(() => {
    if (selectedTextIndex === null) return
    
    const selectedText = texts[selectedTextIndex]
    setTextInput(selectedText.text)
    setTextPosition({ x: selectedText.x, y: selectedText.y })
    setIsEditingText(true)
    setTool('text')
    setShowTextInput(true)
    // Set dialog values from selected text
    setDialogTextColor(selectedText.color)
    setDialogFontSize(selectedText.fontSize)
    
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

  // const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0]
  //   if (!file || !file.type.startsWith('image/')) return
  //   loadImage(URL.createObjectURL(file))
  // }, [loadImage]) (unused)

  // const saveCanvas = useCallback(() => {
  //   if (!canvasRef.current) return
  //   
  //   const link = document.createElement('a')
  //   link.download = `canvas-drawing-${id}.png`
  //   link.href = canvasRef.current.toDataURL()
  //   link.click()
  // }, [id]) (unused)

  // Use external handlers if provided
  // const handleUploadImage = useCallback(() => {
  //   if (externalOnUploadImage) {
  //     externalOnUploadImage()
  //   } else {
  //     fileInputRef.current?.click()
  //   }
  // }, [externalOnUploadImage]) (unused)

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

  // Listen for save event from toolbar
  useEffect(() => {
    const handleSave = (e: CustomEvent) => {
      if (!canvasRef.current) return
      
      const link = document.createElement('a')
      link.download = `canvas-drawing-${Date.now()}.png`
      link.href = canvasRef.current.toDataURL()
      link.click()
    }

    window.addEventListener('triggerSave', handleSave as EventListener)
    return () => window.removeEventListener('triggerSave', handleSave as EventListener)
  }, [])

  // Redraw when state changes
  useEffect(() => {
    drawAll()
  }, [drawAll])

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Text input dialog */}
      {showTextInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {isEditingText ? 'Sửa text' : 'Thêm text mới'}
            </h3>
            <textarea
              ref={textInputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Nhập text..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none mb-4"
              rows={3}
              autoFocus
            />
            
            {/* Color and Size Controls */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Màu sắc
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDialogTextColor(color)}
                      className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                        dialogTextColor === color 
                          ? 'border-gray-800 ring-2 ring-blue-500' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {color === '#FFFFFF' && (
                        <div className="w-full h-full rounded border border-gray-200" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Màu đã chọn: {dialogTextColor}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kích thước: {dialogFontSize}px
                </label>
                <Slider
                  value={[dialogFontSize]}
                  onValueChange={(value) => setDialogFontSize(value[0])}
                  min={8}
                  max={72}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={confirmAddText} className="flex-1">
                {isEditingText ? 'Cập nhật' : 'Thêm'}
              </Button>
              <Button variant="outline" onClick={closeTextInput} className="flex-1">
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div className={`relative rounded-lg overflow-hidden bg-white transition-all duration-200 ${
        isFocused 
          ? 'border-2 border-blue-500 shadow-lg shadow-blue-200' 
          : 'border border-gray-300'
      }`}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="block cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onFocus={handleCanvasFocus}
          onBlur={handleCanvasBlur}
          tabIndex={0}
        />
      </div>
    </div>
  )
}

export default Canvas