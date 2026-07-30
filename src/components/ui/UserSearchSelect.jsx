import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import Avatar from "../ui/Avatar";

export default function UserSearchSelect({ selectedUsers = [], onChange, placeholder = "Search users...", excludeIds = [] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced live search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.get(`/users?search=${encodeURIComponent(query)}`);
        // Filter out excluded IDs and currently selected users
        const filtered = res.data.filter(
          (u) => 
            !excludeIds.includes(u._id) && 
            !selectedUsers.some((sel) => sel._id === u._id)
        );
        setResults(filtered);
        setFocusedIndex(filtered.length > 0 ? 0 : -1);
        setIsOpen(true);
      } catch (err) {
        console.error("User search failed", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query, excludeIds, selectedUsers]);

  // Click outside to close results dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user) => {
    const updated = [...selectedUsers, user];
    onChange(updated);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (userId) => {
    const updated = selectedUsers.filter((u) => u._id !== userId);
    onChange(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) {
        setFocusedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setFocusedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && focusedIndex >= 0 && focusedIndex < results.length) {
        handleSelect(results[focusedIndex]);
      }
    } else if (e.key === "Backspace" && query === "" && selectedUsers.length > 0) {
      // Remove last selected chip
      const lastUser = selectedUsers[selectedUsers.length - 1];
      handleRemove(lastUser._id);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Selected User Chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-surface-950/40 rounded-xl border border-surface-800/40">
          {selectedUsers.map((u) => (
            <div
              key={u._id}
              className="flex items-center gap-1.5 bg-brand-600/15 text-brand-300 border border-brand-500/20 text-xs px-2.5 py-1 rounded-full animate-fade-in"
            >
              <Avatar user={u} size="xs" />
              <span className="font-medium">{u.username}</span>
              <button
                type="button"
                onClick={() => handleRemove(u._id)}
                className="text-slate-400 hover:text-white transition-colors ml-0.5 text-xs font-bold focus:outline-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" fill="none" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="input-base pl-10 pr-10 text-sm py-2.5"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-surface-700 bg-surface-900 shadow-xl divide-y divide-surface-800/40 animate-fade-in">
          {results.map((u, index) => (
            <button
              type="button"
              key={u._id}
              onClick={() => handleSelect(u)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                index === focusedIndex ? "bg-surface-800 text-white" : "hover:bg-surface-850 text-slate-200"
              }`}
            >
              <Avatar user={u} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.username}</p>
                <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Empty State in Dropdown */}
      {isOpen && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute left-0 right-0 z-50 mt-1 p-4 rounded-xl border border-surface-700 bg-surface-900 shadow-xl text-center text-xs text-slate-500">
          No users found.
        </div>
      )}
    </div>
  );
}
