import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  Mic, 
  MicOff, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  Check, 
  Maximize2 
} from 'lucide-react';
import { generateSearchSuggestions } from '../lib/searchEngine';
import { cn } from '../lib/utils';

// Extending window interface for prefix webkitSpeechRecognition
interface SpeechWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface SmartGlobalSearchProps {
  value: string;
  onChange: (val: string) => void;
  filteredRawData: any[];
  userId?: string;
  className?: string;
}

export function SmartGlobalSearch({
  value,
  onChange,
  filteredRawData,
  userId = 'default',
  className
}: SmartGlobalSearchProps) {
  // Local state managers
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize and register recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`recent_sales_searches_${userId}`);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, [userId]);

  const saveToRecent = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 10);
    setRecentSearches(updated);
    try {
      localStorage.setItem(`recent_sales_searches_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Keyboard and dynamic suggestion tracking
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    // Debounce/run generation
    const handler = setTimeout(() => {
      const generated = generateSearchSuggestions(filteredRawData, value, userId);
      setSuggestions(generated);
    }, 150);

    return () => clearTimeout(handler);
  }, [value, filteredRawData, userId]);

  // Handle clicking outside
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Voice Speech Recognition API integration
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Web Speech API. Please try using Google Chrome, Edge or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          let processed = transcript;
          // Simple voice commands mapper
          if (transcript.toLowerCase().startsWith('show invoices for client ')) {
            processed = `client:${transcript.substring(25)}`;
          } else if (transcript.toLowerCase().startsWith('search for client ')) {
            processed = `client:${transcript.substring(18)}`;
          } else if (transcript.toLowerCase().startsWith('status is ')) {
            processed = `status:${transcript.substring(10)}`;
          }

          onChange(processed);
          saveToRecent(processed);
          setIsDropdownOpen(false);
        }
      };

      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  // Keyboard navigation controller
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const listCount = suggestions.length + recentSearches.slice(0, 3).length;
    if (!isDropdownOpen || listCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 < listCount ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 >= 0 ? prev - 1 : listCount - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      const allItems = [...suggestions, ...recentSearches.slice(0, 3)];
      const targetVal = activeIndex >= 0 && activeIndex < allItems.length ? allItems[activeIndex] : value;
      
      onChange(targetVal);
      saveToRecent(targetVal);
      setIsDropdownOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelectVal = (item: string) => {
    onChange(item);
    saveToRecent(item);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
  };

  const clearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(`recent_sales_searches_${userId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const combinedDrowdownItems = useMemo(() => {
    return [
      ...suggestions.map(s => ({ type: 'suggest' as const, value: s })),
      ...recentSearches.slice(0, 3).map(s => ({ type: 'recent' as const, value: s }))
    ];
  }, [suggestions, recentSearches]);

  return (
    <div className="relative w-full ref-smart-global-search font-sans" ref={containerRef} id="universal-search-system">
      <div className="flex gap-2 items-center">
        {/* Modern Search bar wrapper container */}
        <div 
          className={cn(
            "relative flex-1 bg-white border border-black/5 hover:border-brand/30 rounded-2xl flex items-center p-0.5 transition-all shadow-sm ring-brand/10 focus-within:ring-4 focus-within:border-brand",
            className
          )}
        >
          <Search className="w-5 h-5 text-ink/30 ml-4 shrink-0 pointer-events-none" />
          
          <input 
            ref={inputRef}
            type="text"
            placeholder='Search items, invoices, clients, phone, tags like "client:vivian"...'
            value={value}
            onKeyDown={handleKeyDown}
            onChange={e => {
              onChange(e.target.value);
              setIsDropdownOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              setIsDropdownOpen(true);
              setActiveIndex(-1);
            }}
            className="w-full pl-3 pr-4 py-3 bg-transparent text-xs sm:text-sm font-medium text-ink/90 placeholder-ink/30 focus:outline-none"
          />

          {value && (
            <button
              onClick={() => {
                onChange('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="p-1 px-1.5 hover:bg-black/5 text-ink/40 hover:text-ink rounded-lg transition-all"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Mic Search Tool */}
          <button
            onClick={handleVoiceSearch}
            className={cn(
              "p-2 rounded-xl transition-all mr-1 relative flex items-center justify-center",
              isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-black/5 text-ink/40 hover:text-ink"
            )}
            title="Search with Voice Dictation"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Prompt Assist Guide Toggle */}
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 mr-1 hover:bg-black/5 text-ink/40 hover:text-ink rounded-xl transition-all"
            title="How to write Advanced Search tags"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Help Sheet Banner */}
      {showHelp && (
        <div className="absolute top-[105%] left-0 right-0 p-4 bg-ink text-white rounded-2xl shadow-xl z-50 text-xs leading-relaxed space-y-2 max-w-lg mt-1 border border-white/10 animate-fade-in no-print">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold flex items-center gap-1.5 text-brand">
              <Sparkles className="w-3.5 h-3.5" /> Search Assist Syntax Commands
            </span>
            <button onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-white/70 text-[11px]">
            You can type raw keywords or precise narrow tags for fast query execution:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white/5 p-2 rounded-xl">
            <div>
              <span className="text-brand">client:vivian</span> (Clients)
            </div>
            <div>
              <span className="text-brand">invoice:0008</span> (Invoices)
            </div>
            <div>
              <span className="text-brand">item:caps</span> (Products)
            </div>
            <div>
              <span className="text-brand">category:dairy</span> (Dairy Product)
            </div>
            <div>
              <span className="text-brand">status:paid</span> (Paid Invoices)
            </div>
            <div>
              <span className="text-brand">payment:momo</span> (Payment Methods)
            </div>
            <div>
              <span className="text-brand">phone:0244</span> (Phone Prefix)
            </div>
            <div>
              <span className="text-brand">inventory:low</span> (Restock alerts)
            </div>
          </div>
          <p className="text-white/50 text-[10px] text-center italic">
            Example: <span className="text-white font-mono">"client:vivian status:paid drinks"</span>
          </p>
        </div>
      )}

      {/* Autocomplete & Recent Suggestions Dropdown */}
      {isDropdownOpen && combinedDrowdownItems.length > 0 && (
        <div className="absolute top-[105%] left-0 right-0 bg-white border border-black/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-slide-up max-h-[300px] overflow-y-auto no-print">
          <div className="divide-y divide-black/5">
            {combinedDrowdownItems.map((item, idx) => {
              const active = idx === activeIndex;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectVal(item.value)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between",
                    active ? "bg-brand/5 text-brand" : "text-ink/70 hover:bg-black/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.type === 'recent' ? (
                      <Clock className="w-3.5 h-3.5 text-ink/30" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-brand/40" />
                    )}
                    <span className="truncate">{item.value}</span>
                  </div>

                  {item.type === 'recent' ? (
                    <span className="text-[9px] uppercase font-bold text-ink/30 tracking-wider">Recent</span>
                  ) : (
                    <span className="text-[9px] uppercase font-bold text-brand bg-brand/10 text-brand px-1.5 py-0.5 rounded-md scale-90">Autocomplete</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dropdown footer summary */}
          {recentSearches.length > 0 && (
            <div className="bg-paper p-2 px-4 flex items-center justify-between text-[10px] text-ink/40 font-bold border-t">
              <span>Use ↑ ↓ keys to select, enter to search</span>
              <button 
                onClick={clearRecent}
                className="hover:text-red-500 uppercase transition-colors"
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight || !highlight.trim() || !text) {
    return <span>{text}</span>;
  }
  
  // Strip tags like client: from highlight
  let cleanHighlight = highlight.replace(/\w+:(?:"[^"]+"|[^\s]+)/g, '').replace(/\s+/g, ' ').trim();
  if (!cleanHighlight) {
    return <span>{text}</span>;
  }

  try {
    const parts = text.split(new RegExp(`(${cleanHighlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((p, i) => 
          p.toLowerCase() === cleanHighlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-100 text-ink font-bold rounded-sm px-0.5" id={`match-${i}`}>{p}</mark>
          ) : (
            p
          )
        )}
      </span>
    );
  } catch (e) {
    return <span>{text}</span>;
  }
}
