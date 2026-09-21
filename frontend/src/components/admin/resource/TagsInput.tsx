import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

/** กรอกค่าหลายรายการแบบชิป — กด Enter หรือ , เพื่อเพิ่ม, Backspace ตอนช่องว่างเพื่อลบตัวท้าย */
export function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="glass flex flex-wrap items-center gap-1.5 rounded-sm px-3 py-2">
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-sm bg-brand-500/[0.10] px-2 py-1 text-xs font-medium text-brand-500"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            aria-label={`ลบ ${tag}`}
            className="hover:text-danger"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-[8ch] flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
      />
    </div>
  );
}
