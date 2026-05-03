import React from 'react';
import { Share2, ChevronDown, User, GraduationCap, FileCheck } from 'lucide-react';
import { UserMode } from '../types';

interface TopBarProps {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ mode, onModeChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModeIcon = (m: UserMode) => {
    switch (m) {
      case UserMode.STUDENT: return <GraduationCap size={16} />;
      case UserMode.EXAMINER: return <FileCheck size={16} />;
      default: return <User size={16} />;
    }
  };

  const getModeColor = (m: UserMode) => {
    switch (m) {
      case UserMode.STUDENT: return 'text-blue-600 bg-blue-50';
      case UserMode.EXAMINER: return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
      <div className="flex items-center text-gray-500 text-sm font-medium">
        <button className="flex items-center gap-2 hover:text-gray-900 transition-colors">
          <Share2 size={16} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all border border-transparent hover:border-gray-200 hover:shadow-sm ${getModeColor(mode)}`}
        >
          {getModeIcon(mode)}
          <span>{mode} Mode</span>
          <ChevronDown size={14} className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
            {Object.values(UserMode).map((m) => (
              <button
                key={m}
                onClick={() => {
                  onModeChange(m);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-50 ${mode === m ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-600'}`}
              >
                <div className={`p-1 rounded ${mode === m ? 'bg-white shadow-sm' : ''}`}>
                   {getModeIcon(m)}
                </div>
                {m} Mode
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};