import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ToastProvider } from '@/components/ui/toast'
import Canvas from '@/components/Canvas'
import DualCanvas from '@/components/DualCanvas'
import CanvasToolbar from '@/components/CanvasToolbar'
import './styles/globals.css'

function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'single' | 'dual'>('single')
  
  // Canvas tool states - these would be passed to Canvas components
  const [tool, setTool] = useState<'pen' | 'text' | null>(null)
  const [penColor, setPenColor] = useState('#000000')
  const [penSize, setPenSize] = useState(2)
  const [textColor, setTextColor] = useState('#000000')
  const [fontSize, setFontSize] = useState(16)
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [isEditingText, setIsEditingText] = useState(false)

  // Placeholder functions - these would be implemented in Canvas components
  const handleUploadImage = () => {
    // Trigger file input click for the active canvas
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        console.log('File selected:', file.name)
        // This would be handled by the Canvas component
      }
    }
    fileInput.click()
  }

  const handleSaveCanvas = () => {
    // This would trigger save in the active canvas
    console.log('Save canvas for tab:', activeTab)
  }

  const handleMergeImages = () => {
    // Trigger merge in DualCanvas component
    const event = new CustomEvent('triggerMerge')
    window.dispatchEvent(event)
  }

  const handleEditSelectedText = () => {
    if (selectedTextIndex !== null) {
      setIsEditingText(true)
      setShowTextInput(true)
    }
  }

  const handleDeleteSelectedText = () => {
    if (selectedTextIndex !== null) {
      setSelectedTextIndex(null)
      console.log('Delete selected text')
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        {/* Thanh công cụ với tools */}
        <header className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800 mr-4">Snap Mix</h1>
            
            <div className="flex-1">
              <CanvasToolbar
                activeTab={activeTab}
                tool={tool}
                setTool={setTool}
                penColor={penColor}
                setPenColor={setPenColor}
                penSize={penSize}
                setPenSize={setPenSize}
                textColor={textColor}
                setTextColor={setTextColor}
                fontSize={fontSize}
                setFontSize={setFontSize}
                selectedTextIndex={selectedTextIndex}
                editSelectedText={handleEditSelectedText}
                deleteSelectedText={handleDeleteSelectedText}
                onUploadImage={handleUploadImage}
                onSaveCanvas={handleSaveCanvas}
                onMergeImages={activeTab === 'dual' ? handleMergeImages : undefined}
              />
            </div>
          </div>
        </header>

        {/* Nội dung chính */}
        <main className="flex-1 p-4">
          <Tabs defaultValue="single" className="w-full" onValueChange={(value) => setActiveTab(value as 'single' | 'dual')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="single">Chỉnh sửa 1 ảnh</TabsTrigger>
              <TabsTrigger value="dual">Chỉnh sửa 2 ảnh</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <Card>
                  <Canvas 
                    tool={tool}
                    onToolChange={setTool}
                    penColor={penColor}
                    onPenColorChange={setPenColor}
                    penSize={penSize}
                    onPenSizeChange={setPenSize}
                    textColor={textColor}
                    onTextColorChange={setTextColor}
                    fontSize={fontSize}
                    onFontSizeChange={setFontSize}
                    selectedTextIndex={selectedTextIndex}
                    onSelectedTextChange={setSelectedTextIndex}
                    showTextInput={showTextInput}
                    onShowTextInputChange={setShowTextInput}
                    isEditingText={isEditingText}
                    onIsEditingTextChange={setIsEditingText}
                    onUploadImage={handleUploadImage}
                    onSaveCanvas={handleSaveCanvas}
                  />
              </Card>
            </TabsContent>

            <TabsContent value="dual">
              <DualCanvas 
                tool={tool}
                onToolChange={setTool}
                penColor={penColor}
                onPenColorChange={setPenColor}
                penSize={penSize}
                onPenSizeChange={setPenSize}
                textColor={textColor}
                onTextColorChange={setTextColor}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                selectedTextIndex={selectedTextIndex}
                onSelectedTextChange={setSelectedTextIndex}
                showTextInput={showTextInput}
                onShowTextInputChange={setShowTextInput}
                isEditingText={isEditingText}
                onIsEditingTextChange={setIsEditingText}
                onUploadImage={handleUploadImage}
                onSaveCanvas={handleSaveCanvas}
                onMergeImages={handleMergeImages}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ToastProvider>
  )
}

export default App