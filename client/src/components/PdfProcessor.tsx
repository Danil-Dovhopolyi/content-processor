import React, { useState } from 'react';
import {
  processPdfWithGrobid,
  processWithLlm,
  LlmRequestPayload,
} from '../services/processingApi';

// Import sub-components
import FileUpload from './FileUpload';
import SectionSelector from './SectionSelector';
import PromptInput from './PromptInput';
import ResultDisplay from './ResultDisplay';
import ErrorMessage from './ErrorMessage';

interface ExtractedSections {
  [key: string]: string;
}

const PdfProcessor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedSections, setExtractedSections] = useState<ExtractedSections | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [llmResult, setLlmResult] = useState<string>('');
  const [isLoadingGrobid, setIsLoadingGrobid] = useState<boolean>(false);
  const [isLoadingLlm, setIsLoadingLlm] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setExtractedSections(null);
      setSelectedSections([]);
      setLlmResult('');
      setError('');
    }
  };

  const handleGrobidProcess = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsLoadingGrobid(true);
    setError('');
    setExtractedSections(null);
    setSelectedSections([]);
    setLlmResult('');

    try {
      const sections = await processPdfWithGrobid(file);
      setExtractedSections(sections);
      setSelectedSections(Object.keys(sections));
    } catch (err: any) {
      console.error('Error processing with GROBID:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process PDF with GROBID.');
    } finally {
      setIsLoadingGrobid(false);
    }
  };

  const handleSectionSelectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sectionName = event.target.value;
    if (event.target.checked) {
      setSelectedSections((prev) => [...prev, sectionName]);
    } else {
      setSelectedSections((prev) => prev.filter((name) => name !== sectionName));
    }
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const handleLlmProcess = async () => {
    if (!extractedSections || selectedSections.length === 0 || !prompt) {
      setError('Please process a file, select sections, and enter a prompt.');
      return;
    }

    setIsLoadingLlm(true);
    setError('');
    setLlmResult('');

    const payload: LlmRequestPayload = {
      prompt: prompt,
      sections: selectedSections.reduce((acc, sectionName) => {
        if (extractedSections[sectionName]) {
          acc[sectionName] = extractedSections[sectionName];
        }
        return acc;
      }, {} as ExtractedSections),
    };

    try {
      const result = await processWithLlm(payload);
      setLlmResult(result);
    } catch (err: any) {
      console.error('Error processing with LLM:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process with LLM.');
    } finally {
      setIsLoadingLlm(false);
    }
  };

  const canProcessLlm = !!extractedSections && selectedSections.length > 0 && prompt.trim().length > 0;

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold mb-4">Content Processor</h2>

      <FileUpload
        onFileChange={handleFileChange}
        onProcess={handleGrobidProcess}
        isLoading={isLoadingGrobid}
        fileSelected={!!file}
      />

      <ErrorMessage message={error} />

      {extractedSections && (
        <SectionSelector
          sections={extractedSections}
          selectedSections={selectedSections}
          onSelectionChange={handleSectionSelectionChange}
        />
      )}

      {extractedSections && (
        <PromptInput
          prompt={prompt}
          onPromptChange={handlePromptChange}
          onProcess={handleLlmProcess}
          isLoading={isLoadingLlm}
          canProcess={canProcessLlm}
        />
      )}

      <ResultDisplay result={llmResult} />

    </div>
  );
};

export default PdfProcessor; 