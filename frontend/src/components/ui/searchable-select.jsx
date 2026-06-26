import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SearchableSelect({ items, value, onValueChange, placeholder = "Pilih..." }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedItem = items.find(item => item.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-colors text-left"
        )}
      >
        <span className="truncate">
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg flex flex-col">
          <div className="flex items-center border-b px-3 py-2 shrink-0">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48 p-1">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Tidak ditemukan.</div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onValueChange(item.value);
                    setOpen(false);
                    setSearchTerm('');
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left",
                    item.value === value && "bg-accent text-accent-foreground"
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {item.value === value && <Check className="h-4 w-4" />}
                  </span>
                  <span>{item.labelNode || item.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
