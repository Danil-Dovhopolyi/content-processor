import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';


export interface ExtractedSectionsDto {
  sections: { [key: string]: string };
}

export interface LlmRequestPayload {
  prompt: string;
  sections: { [key: string]: string };
}

export interface LlmResponsePayload {
  result: string;
}

/**
 * Sends the PDF file to the backend for GROBID processing.
 * @param file The PDF file to process.
 * @returns The extracted sections.
 */
export const processPdfWithGrobid = async (file: File): Promise<ExtractedSectionsDto['sections']> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<ExtractedSectionsDto>(
    `${API_BASE_URL}/processing`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.sections;
};

/**
 * Sends the selected sections and prompt to the backend for LLM processing.
 * @param payload The prompt and selected sections.
 * @returns The result from the LLM.
 */
export const processWithLlm = async (payload: LlmRequestPayload): Promise<string> => {
  const response = await axios.post<LlmResponsePayload>(
    `${API_BASE_URL}/processing/llm`,
    payload
  );
  return response.data.result;
};
