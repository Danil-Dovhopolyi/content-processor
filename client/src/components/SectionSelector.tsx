import React from 'react';

interface SectionSelectorProps {
  sections: { [key: string]: string };
  selectedSections: string[];
  onSelectionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SectionSelector: React.FC<SectionSelectorProps> = ({ sections, selectedSections, onSelectionChange }) => {
  return (
    <div className="space-y-2 p-4 border border-gray-200 rounded">
      <h3 className="text-lg font-semibold mb-2">Select Sections for LLM:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {Object.keys(sections).map((sectionName) => (
          <div key={sectionName} className="flex items-center space-x-2 bg-gray-50 p-2 rounded border border-gray-100">
            <input
              type="checkbox"
              id={`section-${sectionName}`}
              value={sectionName}
              checked={selectedSections.includes(sectionName)}
              onChange={onSelectionChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`section-${sectionName}`} className="text-sm font-medium text-gray-700 truncate" title={sections[sectionName]}>
              {sectionName} <span className="text-gray-500">({sections[sectionName]?.substring(0, 50)}...)</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionSelector; 