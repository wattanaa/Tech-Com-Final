import { useEffect, useMemo, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';
import { createCroppedImageBlob } from '@/utils/cropImage';

const ASPECT_PRESETS: { label: string; value: number | null }[] = [
  { label: 'ตามภาพเดิม', value: null },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
];

/**
 * ครอป + ย่อขนาดไฟล์ภาพก่อนอัปโหลด — ใช้ react-easy-crop สำหรับลาก/ซูม
 * ส่วนพิกัดที่ครอปจริงคำนวณเป็นภาพผลลัพธ์ด้วย utils/cropImage.ts
 */
export function ImageCropModal({
  file,
  open,
  onCancel,
  onConfirm,
}: {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob, filename: string) => void;
}) {
  const [naturalAspect, setNaturalAspect] = useState(1);
  const [aspect, setAspect] = useState<number | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [outputWidth, setOutputWidth] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const imageSrc = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => setNaturalAspect(img.width / img.height);
    img.src = imageSrc;
    return () => URL.revokeObjectURL(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    // รีเซ็ตค่าทุกครั้งที่เปลี่ยนไฟล์ใหม่ — กันค่าครอปเก่าเหลือค้างข้ามรูป
    setAspect(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setOutputWidth('');
    // สำคัญ: ต้องล้างค่าครอปเก่าด้วย ไม่งั้นตอนเลื่อนไปไฟล์ถัดไปในคิวจะมีช่วงสั้น ๆ
    // ที่ปุ่ม "ใช้รูปนี้" ยังใช้พิกัดของรูปก่อนหน้าอยู่ ก่อน onCropComplete ของรูปใหม่จะทำงาน
    setCroppedAreaPixels(null);
  }, [file]);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const width = outputWidth ? Number(outputWidth) : undefined;
      const blob = await createCroppedImageBlob(imageSrc, croppedAreaPixels, width);
      const baseName = (file?.name ?? 'image').replace(/\.[^./]+$/, '');
      onConfirm(blob, `${baseName}.png`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal open={open && !!file} onClose={onCancel} title={`ปรับแต่งรูปภาพ${file ? `: ${file.name}` : ''}`} size="lg">
      <div className="flex flex-col gap-4">
        <div className="relative h-80 w-full overflow-hidden rounded-sm bg-black/80 sm:h-96">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect ?? naturalAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-subtle">สัดส่วนภาพ:</span>
          {ASPECT_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="xs"
              variant={aspect === preset.value ? 'primary' : 'outline'}
              onClick={() => setAspect(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="crop-zoom" className="text-xs font-medium text-ink-subtle">
            ซูม
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <label htmlFor="crop-output-width" className="text-xs font-medium text-ink-subtle">
            ความกว้างสูงสุดของภาพ (พิกเซล — เว้นว่างถ้าไม่ต้องการย่อ)
          </label>
          <input
            id="crop-output-width"
            type="number"
            min={16}
            placeholder="เช่น 1200"
            value={outputWidth}
            onChange={(e) => setOutputWidth(e.target.value)}
            className="glass rounded-sm px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            ข้ามไฟล์นี้
          </Button>
          <Button
            type="button"
            size="sm"
            isLoading={isProcessing}
            disabled={!croppedAreaPixels}
            onClick={handleConfirm}
          >
            {croppedAreaPixels ? 'ใช้รูปนี้' : 'กำลังโหลดภาพ…'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
