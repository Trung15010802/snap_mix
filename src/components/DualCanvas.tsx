import React, { useRef, useState } from 'react';
import Canvas from './Canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { mergeImages, downloadImage, copyToClipboard } from '@/lib/utils';

const DualCanvas: React.FC = () => {
  // canvas element refs
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // states
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [mergedImageUrl, setMergedImageUrl] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string>('');

  // when child Canvas is ready
  const handleLeftCanvasReady = (canvas: HTMLCanvasElement) => {
    leftCanvasRef.current = canvas;
  };

  const handleRightCanvasReady = (canvas: HTMLCanvasElement) => {
    rightCanvasRef.current = canvas;
  };

  // merge two canvases
  const handleMergeImages = () => {
    if (!leftCanvasRef.current || !rightCanvasRef.current) {
      alert('Vui lòng thêm ảnh vào cả hai khung trước khi ghép');
      return;
    }

    const mergedUrl = mergeImages(leftCanvasRef.current, rightCanvasRef.current);
    setMergedImageUrl(mergedUrl);
    setShowExportDialog(true);
  };

  // save image
  const handleSaveToDevice = () => {
    if (!mergedImageUrl) return;

    downloadImage(mergedImageUrl, 'snap-mix-merged.png');
    setExportStatus('Đã lưu ảnh thành công!');

    setTimeout(() => {
      setExportStatus('');
    }, 2000);
  };

  // copy image to clipboard
  const handleCopyToClipboard = async () => {
    if (!mergedImageUrl) return;

    try {
      await copyToClipboard(mergedImageUrl);
      setExportStatus('Đã copy ảnh vào clipboard!');

      setTimeout(() => {
        setExportStatus('');
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi copy ảnh:', error);
      setExportStatus('Không thể copy ảnh. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="dual-canvas-container">
        <div className="canvas-wrapper">
          <Canvas id="left-canvas" onCanvasReady={handleLeftCanvasReady} />
        </div>
        <div className="canvas-wrapper">
          <Canvas id="right-canvas" onCanvasReady={handleRightCanvasReady} />
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <Button onClick={handleMergeImages} className="px-8">
          Ghép & Xuất ảnh
        </Button>
      </div>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xuất ảnh đã ghép</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {mergedImageUrl && (
              <img
                src={mergedImageUrl}
                alt="Ảnh đã ghép"
                className="max-w-full max-h-[300px] border rounded-md"
              />
            )}

            {exportStatus && (
              <div className="text-green-600 font-medium">{exportStatus}</div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button onClick={handleSaveToDevice}>Lưu xuống máy</Button>
            <Button onClick={handleCopyToClipboard}>Copy vào Clipboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DualCanvas;
