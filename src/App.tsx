import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToastProvider } from '@/components/ui/toast'
import Canvas from '@/components/Canvas'
import DualCanvas from '@/components/DualCanvas'
import './styles/globals.css'

function App(): JSX.Element {
  return (
    <ToastProvider>
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Snap Mix</h1>
          <p className="text-muted-foreground">
            Công cụ chỉnh sửa và ghép ảnh đơn giản
          </p>
        </header>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="single">Chỉnh sửa 1 ảnh</TabsTrigger>
            <TabsTrigger value="dual">Chỉnh sửa 2 ảnh</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>Chỉnh sửa ảnh đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Dán ảnh từ clipboard (Ctrl+V) hoặc sử dụng các công cụ để chỉnh sửa
                </div>
                <Canvas />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dual">
            <Card>
              <CardHeader>
                <CardTitle>Chỉnh sửa và ghép 2 ảnh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Dán ảnh vào từng khung, chỉnh sửa và ghép lại thành một ảnh duy nhất
                </div>
                <DualCanvas />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ToastProvider>
  )
}

export default App