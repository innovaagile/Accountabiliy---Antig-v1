import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoPopoverProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'end' | 'start';
  className?: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({ content, position = 'bottom', align = 'center', className = '' }) => {
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

  let positionClasses = 'top-full mt-2';
  let arrowClasses = '-top-2 border-t border-l';

  // Alineación horizontal
  if (align === 'center') {
    positionClasses += ' left-1/2 -translate-x-1/2';
    arrowClasses += ' left-1/2 -translate-x-1/2';
  } else if (align === 'end') {
    positionClasses += ' right-0';
    arrowClasses += ' right-4';
  } else if (align === 'start') {
    positionClasses += ' left-0';
    arrowClasses += ' left-4';
  }

  if (position === 'top') {
    positionClasses = positionClasses.replace('top-full mt-2', 'bottom-full mb-2');
    arrowClasses = arrowClasses.replace('-top-2 border-t border-l', '-bottom-2 border-b border-r');
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
        <div className={`absolute z-[9999] w-56 sm:w-64 p-3 text-sm font-medium text-gray-600 bg-white border border-gray-100 rounded-xl shadow-lg animate-in fade-in ${positionClasses}`}>
          <div className={`absolute w-4 h-4 bg-white border-gray-100 rotate-45 ${arrowClasses}`}></div>
          <div className="relative bg-white z-10 text-left normal-case tracking-normal">{content}</div>
        </div>
      )}
    </div>
  );
};
