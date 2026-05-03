import React from 'react';
import { CognifyResponse, UserMode, Question, Concept } from '../types';
import { Book, AlertCircle, CheckCircle, Tag, Brain, List } from 'lucide-react';

interface OutputRendererProps {
  data: CognifyResponse;
  mode: UserMode;
}

export const OutputRenderer: React.FC<OutputRendererProps> = ({ data, mode }) => {
  
  const DifficultyBadge = ({ level }: { level: string }) => {
    const colors = {
      Easy: 'bg-green-100 text-green-700 border-green-200',
      Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Hard: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[level as keyof typeof colors] || colors.Medium}`}>
        {level}
      </span>
    );
  };

  const PriorityBadge = ({ level }: { level: string }) => {
    if (!level) return null;
    const colors = {
        High: 'text-red-600 bg-red-50',
        Medium: 'text-orange-600 bg-orange-50',
        Low: 'text-gray-500 bg-gray-50',
    };
    return (
        <span className={`text-[10px] uppercase tracking-wider font-bold ml-2 px-1.5 rounded ${colors[level as keyof typeof colors]}`}>
            {level} Priority
        </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Summary */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Analysis Result</h1>
        <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
          <div className="flex items-start gap-3">
            <Brain className="text-gray-400 mt-1 shrink-0" size={20} />
            <p className="text-gray-700 leading-relaxed text-base">{data.summary}</p>
          </div>
        </div>
      </div>

      {/* Concepts Grid */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
            <Book className="text-gray-400" size={18} />
            <h2 className="text-lg font-semibold text-gray-800">Key Concepts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.concepts.map((concept, idx) => (
            <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                {concept.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{concept.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Questions Section - Mode Specific Layout */}
      <div>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <List className="text-gray-400" size={18} />
                <h2 className="text-lg font-semibold text-gray-800">
                    {mode === UserMode.EXAMINER ? 'Generated Assessment' : 'Practice Questions'}
                </h2>
            </div>
            {mode === UserMode.EXAMINER && (
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Total Questions: {data.questions.length}
                </span>
            )}
        </div>

        <div className="space-y-6">
          {data.questions.map((q, idx) => (
            <div key={idx} className="group border border-gray-200 rounded-xl overflow-hidden bg-white transition-all hover:border-gray-300">
              {/* Question Header */}
              <div className="p-4 bg-white border-b border-gray-50 flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono text-gray-400">#{q.id}</span>
                        <DifficultyBadge level={q.difficulty} />
                        {mode === UserMode.STUDENT && q.priority && <PriorityBadge level={q.priority} />}
                        {mode === UserMode.EXAMINER && q.marks && (
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-1.5 rounded">
                                {q.marks} Marks
                            </span>
                        )}
                   </div>
                   <h3 className="text-base font-medium text-gray-900 leading-snug">{q.text}</h3>
                </div>
              </div>

              {/* Answer Section */}
              <div className="px-4 py-3 bg-gray-50/50 group-hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2">
                    <div className="mt-0.5 min-w-[16px]">
                        {mode === UserMode.EXAMINER ? (
                            <CheckCircle size={14} className="text-green-600" />
                        ) : (
                            <AlertCircle size={14} className="text-blue-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400 font-bold mb-1">
                            {mode === UserMode.EXAMINER ? 'Marking Key' : 'Answer'}
                        </p>
                        <p className="text-sm text-gray-700">{q.answer}</p>
                    </div>
                </div>
              </div>
              
              {/* Footer Meta (Topic ref) */}
              {q.topicRef && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-white flex items-center gap-1.5">
                      <Tag size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">Relates to: {q.topicRef}</span>
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Examiner Coverage Analysis */}
      {mode === UserMode.EXAMINER && data.coverageAnalysis && (
          <div className="mt-12 p-5 border border-purple-100 bg-purple-50/30 rounded-xl">
              <h3 className="text-sm font-bold text-purple-900 mb-2 uppercase tracking-wide">Coverage Analysis</h3>
              <p className="text-sm text-purple-800">{data.coverageAnalysis}</p>
          </div>
      )}

    </div>
  );
};