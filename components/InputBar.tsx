import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Image as ImageIcon, X, Paperclip, FileText, ChevronUp } from 'lucide-react';
import { ProcessingState } from '../types';

interface InputBarProps {
  onSend: (text: string, file?: File) => void;
  processingState: ProcessingState;
}

export const InputBar: React.FC<InputBarProps> = ({ onSend, processingState }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && !file) || processingState.status === 'processing') return;
    onSend(text, file || undefined);
    setText('');
    setFile(null);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (acceptType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // CRITICAL FIX: Reset input so same file can be selected again
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const adjustHeight = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  const getFileIcon = (f: File) => {
    if (f.type.includes('pdf')) return <FileText size={14} className="text-red-500" />;
    return <ImageIcon size={14} className="text-blue-500" />;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 mb-4">
      {/* File Preview */}
      {file && (
        <div className="mb-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 animate-in fade-in slide-in-from-bottom-2 border border-gray-200">
          {getFileIcon(file)}
          <span className="max-w-[200px] truncate">{file.name}</span>
          <button 
            onClick={() => setFile(null)}
            className="hover:bg-gray-200 rounded-full p-0.5 ml-1 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className={`relative bg-white border shadow-sm rounded-xl transition-all ${processingState.status === 'processing' ? 'border-gray-200 opacity-75' : 'border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 focus-within:border-gray-400'}`}>
        <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); adjustHeight(e); }}
            onKeyDown={handleKeyDown}
            placeholder="Paste text, notes, or attach a file..."
            rows={1}
            disabled={processingState.status === 'processing'}
            className="w-full px-4 py-3.5 pr-20 bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400 min-h-[52px] max-h-[200px]"
        />
        
        <div className="absolute bottom-2.5 right-2 flex items-center gap-1">
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            
            <div className="relative" ref={menuRef}>
              <button
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  disabled={processingState.status === 'processing'}
                  className={`p-2 rounded-lg transition-colors ${showAttachMenu ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  title="Attach"
              >
                  <Paperclip size={18} />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                    Attach Resource
                  </div>
                  <button 
                    onClick={() => handleFileSelect('image/*')}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <ImageIcon size={16} className="text-blue-500" />
                    Upload Image
                  </button>
                  <button 
                    onClick={() => handleFileSelect('application/pdf')}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <FileText size={16} className="text-red-500" />
                    Upload PDF
                  </button>
                </div>
              )}
            </div>
            
            <button
                onClick={handleSubmit}
                disabled={(!text.trim() && !file) || processingState.status === 'processing'}
                className={`p-2 rounded-lg transition-all ${
                    (!text.trim() && !file) || processingState.status === 'processing'
                    ? 'bg-gray-100 text-gray-300' 
                    : 'bg-black text-white hover:bg-gray-800 shadow-sm'
                }`}
            >
                <ArrowUp size={18} />
            </button>
        </div>
      </div>
      <div className="text-center mt-2">
         <p className="text-[10px] text-gray-400">Supports Images (PNG, JPG) and Documents (PDF).</p>
      </div>
    </div>
  );
};