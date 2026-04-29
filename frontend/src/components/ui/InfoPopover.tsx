import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoPopoverProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({ content, position = 'bottom', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  let positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2';
  let arrowClasses = '-top-2 left-1/2 -translate-x-1/2 border-t border-l';

  if (position === 'top') {
    positionClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    arrowClasses = '-bottom-2 left-1/2 -translate-x-1/2 border-b border-r';
  } else if (position === 'left') {
    positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2';
    arrowClasses = '-right-2 top-1/2 -translate-y-1/2 border-t border-r';
  } else if (position === 'right') {
    positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2';
    arrowClasses = '-left-2 top-1/2 -translate-y-1/2 border-b border-l';
  }

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={popoverRef}>
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        className="focus:outline-none focus:ring-2 focus:ring-[#A9D42C] rounded-full p-0.5"
      >
        <Info className={`w-4 h-4 transition-colors ${isOpen ? 'text-[#1B254B]' : 'text-gray-400 hover:text-gray-600'}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute z-[100] w-64 p-3 text-sm font-medium text-gray-600 bg-white border border-gray-100 rounded-xl shadow-lg animate-in fade-in ${positionClasses}`}>
          <div className={`absolute w-4 h-4 bg-white border-gray-100 rotate-45 ${arrowClasses}`}></div>
          <div className="relative bg-white z-10 text-left normal-case tracking-normal">{content}</div>
        </div>
      )}
    </div>
  );
};
