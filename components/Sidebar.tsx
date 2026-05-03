import React from 'react';
import { Plus, Clock, Layout, Settings, BookOpen } from 'lucide-react';
import { Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onNewSession, 
  onSelectSession,
  onOpenSettings,
  onOpenTemplates
}) => {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col hidden md:flex">
      <div className="p-4 mb-2">
        <div className="flex items-center gap-2 mb-6 text-gray-800">
          <div className="bg-black text-white p-1 rounded-md">
            <BookOpen size={18} />
          </div>
          <span className="font-semibold text-lg tracking-tight">Cognify</span>
        </div>
        
        <button 
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group"
        >
          <Plus size={16} className="text-gray-400 group-hover:text-gray-600" />
          New Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="text-xs font-semibold text-gray-400 px-2 mb-2 uppercase tracking-wider">
          History
        </div>
        <div className="space-y-0.5">
          {sessions.length === 0 ? (
            <div className="px-2 py-4 text-xs text-gray-400 text-center italic">
              No sessions yet
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} className={currentSessionId === session.id ? "text-gray-600" : "text-gray-400"} />
                  <span className="truncate">{session.title}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 text-sm text-gray-500 hover:text-gray-900 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <button 
          onClick={onOpenTemplates}
          className="w-full flex items-center gap-3 text-sm text-gray-500 hover:text-gray-900 cursor-pointer p-2 rounded hover:bg-gray-100 mt-1 transition-colors"
        >
          <Layout size={16} />
          <span>Templates</span>
        </button>
      </div>
    </div>
  );
};