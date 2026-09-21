import { useState } from 'react';

/**
 * จัดคิวไฟล์ที่เลือกไว้ให้ผ่าน ImageCropModal ทีละไฟล์ก่อนอัปโหลดจริง
 * ใช้ร่วมกันระหว่าง MediaLibraryPage และ MediaPickerModal — เลือกได้หลายไฟล์
 * พร้อมกัน แต่ครอปทีละรูป แล้วค่อยอัปโหลดทั้งชุดพร้อมกันตอนจบคิว
 */
export function useCropUploadQueue(onReady: (files: File[]) => void) {
  const [queue, setQueue] = useState<File[]>([]);
  const [ready, setReady] = useState<File[]>([]);

  const start = (files: File[]) => {
    setReady([]);
    setQueue(files);
  };

  const currentFile = queue[0] ?? null;

  const finish = (nextReady: File[]) => {
    if (nextReady.length > 0) onReady(nextReady);
    setReady([]);
    setQueue([]);
  };

  const confirmCurrent = (blob: Blob, filename: string) => {
    const nextReady = [...ready, new File([blob], filename, { type: blob.type })];
    const rest = queue.slice(1);
    if (rest.length === 0) {
      finish(nextReady);
    } else {
      setReady(nextReady);
      setQueue(rest);
    }
  };

  const skipCurrent = () => {
    const rest = queue.slice(1);
    if (rest.length === 0) {
      finish(ready);
    } else {
      setQueue(rest);
    }
  };

  return { currentFile, start, confirmCurrent, skipCurrent };
}
