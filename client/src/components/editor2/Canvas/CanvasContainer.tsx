import React from 'react';

export const CanvasContainer: React.FC = () => {
  return (
    <div className="relative w-full h-full overflow-auto">
      {/* Canvas Background */}
      <div 
        className="min-h-full bg-gray-50"
        style={{ backgroundColor: '#f8f9fa' }}
      >
        {/* Craft.js Integration Area - To be implemented */}
        <div className="w-full">
          {/* Empty State - Temporarily */}
          <div className="flex items-center justify-center min-h-[400px] text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-lg font-medium mb-2">Canvas Cleaned</h3>
              <p className="text-sm">Ready for Craft.js integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};