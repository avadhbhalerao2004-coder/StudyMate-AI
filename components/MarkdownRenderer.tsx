import React from 'react';

interface Props {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content, className = '' }) => {
  // This is a lightweight parser for basic formatting
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let formattedLine: React.ReactNode = line;

      // Bold: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      if (parts.length > 1) {
        formattedLine = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-indigo-600 dark:text-indigo-400">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      }
      
      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
            <div key={index} className="flex items-start ml-2 mb-1">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500"></span>
                <span className="flex-1">{formattedLine.toString().replace(/^[-*]\s/, '')}</span>
            </div>
        );
      }

      // Headers (Basic support)
      if (line.startsWith('### ')) {
         return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-100">{line.replace('### ', '')}</h3>
      }

      return <p key={index} className="mb-1 min-h-[1.25rem]">{formattedLine}</p>;
    });
  };

  return (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {parseContent(content)}
    </div>
  );
};