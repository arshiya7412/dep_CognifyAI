import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { InputBar } from './components/InputBar';
import { OutputRenderer } from './components/OutputRenderer';
import { UserMode, Session, ProcessingState } from './types';
import { generateCognifyResponse } from './services/gemini';
import { Loader2, Sparkles, AlertTriangle, X, Trash2, User } from 'lucide-react';

// -- Sub-Components for Modals --

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<UserMode>(UserMode.GENERAL);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  
  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cognify_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('cognify_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setProcessingState({ status: 'idle' });
    clearTimers();
  };

  const handleSwitchMode = (newMode: UserMode) => {
    if (newMode === mode) return;

    // If we have an active session with data, "Close" it (it's already saved in state)
    // and start a fresh one for the new mode.
    if (currentSessionId) {
       handleNewSession();
    }
    
    setMode(newMode);
  };

  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
        setCurrentSessionId(id);
        setMode(session.mode); // Restore the mode of that session
        setProcessingState({ status: 'success' }); 
        clearTimers();
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to delete all sessions?")) {
      setSessions([]);
      setCurrentSessionId(null);
      setProcessingState({ status: 'idle' });
      setShowSettings(false);
    }
  };

  const handleSend = async (text: string, file?: File) => {
    clearTimers();
    setProcessingState({ status: 'processing', message: 'Analyzing content...' });
    
    // Determine attachment type logic
    const isPdf = file?.type === 'application/pdf';
    
    const fileLabel = file ? `[${isPdf ? 'PDF' : 'Image'}: ${file.name}]` : '';
    const userMessage = text.trim() ? text : (fileLabel ? "Analyze this file" : "New Analysis");
    const displayTitle = text ? text.slice(0, 30) : file?.name || 'New Session';

    let sessionId = currentSessionId;
    let currentHistory: { role: 'user' | 'model'; text: string }[] = [];

    // Create new session if none exists
    if (!sessionId) {
      sessionId = Date.now().toString();
      const newSession: Session = {
        id: sessionId,
        title: displayTitle,
        timestamp: Date.now(),
        mode: mode,
        data: null,
        history: [{ role: 'user', text: `${text} ${fileLabel}`.trim() }]
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
      currentHistory = newSession.history;
    } else {
        // Append to existing
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            currentHistory = [...session.history, { role: 'user', text: `${text} ${fileLabel}`.trim() }];
            setSessions(prev => prev.map(s => {
                if (s.id === sessionId) {
                    return {
                        ...s,
                        history: currentHistory
                    }
                }
                return s;
            }));
        }
    }

    try {
      let attachment: { base64: string; mimeType: string } | undefined;
      
      if (file) {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        attachment = {
          base64: base64String,
          mimeType: file.type
        };
      }

      // UX Timers
      const t1 = setTimeout(() => {
        setProcessingState(p => p.status === 'processing' ? ({ ...p, message: isPdf ? 'Reading document pages...' : 'Extracting knowledge graph...' }) : p);
      }, 1500);
      
      const t2 = setTimeout(() => {
        setProcessingState(p => p.status === 'processing' ? ({ ...p, message: `Generating ${mode.toLowerCase()} materials...` }) : p);
      }, 3000);
      
      timersRef.current.push(t1, t2);

      // Pass history to the AI service
      const result = await generateCognifyResponse(text, mode, currentHistory, attachment);
      
      clearTimers();

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            data: result,
            title: result.summary.slice(0, 40) + "...",
            // Add model response to history for next turn
            history: [...s.history, { role: 'model', text: JSON.stringify(result) }]
          };
        }
        return s;
      }));
      setProcessingState({ status: 'success' });

    } catch (error) {
      clearTimers();
      console.error(error);
      setProcessingState({ 
        status: 'error', 
        message: 'Failed to process content. Ensure your API Key is valid and the file size is reasonable.' 
      });
    }
  };

  const handleTemplateClick = (templateText: string) => {
    setShowTemplates(false);
    handleSend(templateText);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const latestUserMessage = currentSession?.history.filter(h => h.role === 'user').pop();

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Sidebar */}
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onOpenSettings={() => setShowSettings(true)}
        onOpenTemplates={() => setShowTemplates(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        <TopBar mode={mode} onModeChange={handleSwitchMode} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
          
          {/* Empty State */}
          {!currentSession && processingState.status === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                <Sparkles className="text-gray-400" size={32} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                 {mode === UserMode.EXAMINER ? "Examiner Dashboard" : 
                  mode === UserMode.STUDENT ? "Student Revision Hub" : "Knowledge Base"}
              </h2>
              <p className="text-gray-500 mb-8">
                {mode === UserMode.EXAMINER ? "Upload materials to generate exam papers, marking schemes, and coverage analysis." :
                 mode === UserMode.STUDENT ? "Upload your notes to get a study plan, prioritized questions, and flashcards." :
                 "Paste text or upload documents. I'll summarize concepts and create general questions for you."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-sm">
                 <button onClick={() => handleSend("Create a quiz about photosynthesis")} className="p-3 border border-gray-200 rounded-lg text-gray-600 bg-white hover:border-gray-300 transition-colors text-left">
                    🌱 Quiz on Photosynthesis
                 </button>
                 <button onClick={() => handleSend("Explain Quantum Entanglement simply")} className="p-3 border border-gray-200 rounded-lg text-gray-600 bg-white hover:border-gray-300 transition-colors text-left">
                    ⚛️ Quantum Physics Basics
                 </button>
              </div>
            </div>
          )}

          {/* User Input Bubble Display (Show the query being analyzed) */}
          {currentSession && (
              <div className="max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-end mb-4">
                      <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%] shadow-sm">
                          <div className="flex items-center gap-2 mb-1 opacity-50">
                             <User size={12} />
                             <span className="text-xs font-semibold uppercase tracking-wider">You</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {latestUserMessage?.text || "Analyzing content..."}
                          </p>
                      </div>
                  </div>
              </div>
          )}

          {/* Processing State */}
          {processingState.status === 'processing' && (
             <div className="h-full flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="animate-spin text-gray-900 mb-4" size={40} />
                <p className="text-gray-500 font-medium animate-pulse">{processingState.message}</p>
             </div>
          )}

           {/* Error State */}
           {processingState.status === 'error' && (
             <div className="h-full flex flex-col items-center justify-center text-red-500 min-h-[200px]">
                <AlertTriangle size={40} className="mb-4" />
                <p className="font-medium">{processingState.message}</p>
                <button 
                  onClick={() => setProcessingState({status: 'idle'})}
                  className="mt-4 text-sm text-gray-600 underline"
                >
                    Try Again
                </button>
             </div>
          )}

          {/* Result Display */}
          {currentSession?.data && processingState.status !== 'processing' && (
            <OutputRenderer data={currentSession.data} mode={currentSession.mode} />
          )}

        </div>

        {/* Floating Input Area (Sticky Bottom) */}
        <div className="bg-gradient-to-t from-white via-white to-transparent pb-6 pt-10 px-6 z-20">
          <InputBar onSend={handleSend} processingState={processingState} />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Data Management</h4>
              <button 
                onClick={clearHistory}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                Clear All History
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                This will remove all your saved sessions from this browser.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <Modal title="Quick Start Templates" onClose={() => setShowTemplates(false)}>
          <div className="grid gap-3">
            {[
              { icon: "🧬", text: "Explain DNA replication structure" },
              { icon: "🏛️", text: "Key events of the French Revolution" },
              { icon: "💻", text: "React Hooks explained for beginners" },
              { icon: "📈", text: "Marketing strategies for startups" }
            ].map((t, i) => (
              <button 
                key={i}
                onClick={() => handleTemplateClick(t.text)}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-xl">{t.icon}</span>
                <span className="text-sm text-gray-700 font-medium">{t.text}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

    </div>
  );
};

export default App;