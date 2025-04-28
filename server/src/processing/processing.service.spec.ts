import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

import { ProcessingService } from './processing.service';
import { TeiParserService } from './tei-parser.service';
import { LlmRequestDto } from './dto/llm-request.dto';

const mockHttpService = {
  post: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    if (key === 'GROBID_URL') return 'http://mock-grobid:8070';
    if (key === 'GOOGLE_API_KEY') return 'MOCK_API_KEY';
    return defaultValue;
  }),
};

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

const mockParseStringPromise = jest.fn();
jest.mock('xml2js', () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parseStringPromise: mockParseStringPromise,
  })),
}));

describe('ProcessingService', () => {
  let service: ProcessingService;
  let teiParserService: TeiParserService;
  let httpService: HttpService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockHttpService.post.mockClear();
    mockParseStringPromise.mockClear();
    mockGenerateContent.mockClear();
    mockGetGenerativeModel.mockClear();
    mockConfigService.get.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessingService,
        TeiParserService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ProcessingService>(ProcessingService);
    teiParserService = module.get<TeiParserService>(TeiParserService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processDocument', () => {
    const fileBuffer = Buffer.from('dummy pdf content');
    const filename = 'test.pdf';
    const mockTeiXml = `
      <TEI>
        <teiHeader>
          <fileDesc>
            <titleStmt><title>Mock Title</title></titleStmt>
            <profileDesc><abstract><p>Mock Abstract</p></abstract></profileDesc>
          </fileDesc>
        </teiHeader>
        <text>
          <body><div>Body Content</div></body>
          <back><div><listBibl><biblStruct>Ref 1</biblStruct></listBibl></div></back>
        </text>
      </TEI>
    `;
    const mockParsedXml = {
      TEI: {
        teiHeader: {
          fileDesc: {
            titleStmt: { title: { _: 'Mock Title' } },
            profileDesc: { abstract: { p: 'Mock Abstract' } },
          },
        },
        text: {
          body: { div: 'Body Content' },
          back: { div: { listBibl: { biblStruct: 'Ref 1' } } },
        },
      },
    };

    it('should process PDF and return extracted sections on success', async () => {
      mockHttpService.post.mockReturnValue(of({ status: 200, data: mockTeiXml, headers: {}, config: {}, statusText: 'OK' }));
      mockParseStringPromise.mockResolvedValue(mockParsedXml);
      const mockExtractedSections = { title: 'Mock Title', abstract: 'Mock Abstract' };
      const extractSpy = jest.spyOn(teiParserService, 'extractSectionsFromTei').mockReturnValue(mockExtractedSections);

      const result = await service.processDocument(fileBuffer, filename);

      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
      const callArgs = mockHttpService.post.mock.calls[0];
      expect(callArgs[0]).toBe('http://mock-grobid:8070/api/processFulltextDocument');
      expect(typeof callArgs[1].getHeaders).toBe('function');
      expect(typeof callArgs[1].append).toBe('function');
      expect(callArgs[2]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ Accept: 'application/xml' }),
        responseType: 'text',
      }));
      expect(mockParseStringPromise).toHaveBeenCalledWith(mockTeiXml);
      expect(extractSpy).toHaveBeenCalledWith(mockParsedXml);
      expect(result).toEqual({
        message: 'File processed successfully by GROBID.',
        sections: mockExtractedSections,
      });
      extractSpy.mockRestore();
    });

    it('should throw an error if GROBID returns non-200 status', async () => {
      mockHttpService.post.mockReturnValue(of({ status: 500, data: 'Server Error', headers: {}, config: {}, statusText: 'Internal Server Error' }));

      await expect(service.processDocument(fileBuffer, filename)).rejects.toThrow(
        'GROBID processing failed with status 500'
      );
      expect(mockParseStringPromise).not.toHaveBeenCalled();
    });

    it('should throw an error if HttpService call fails', async () => {
      const networkError = new Error('Network connection failed');
      mockHttpService.post.mockReturnValue(throwError(() => networkError));

      await expect(service.processDocument(fileBuffer, filename)).rejects.toThrow(
        `Failed to process document with GROBID: ${networkError.message}`
      );
    });

    it('should throw an error if XML parsing fails', async () => {
      const parsingError = new Error('Invalid XML');
      mockHttpService.post.mockReturnValue(of({ status: 200, data: '<invalid xml>', headers: {}, config: {}, statusText: 'OK' }));
      mockParseStringPromise.mockRejectedValue(parsingError);

      await expect(service.processDocument(fileBuffer, filename)).rejects.toThrow(
        `Failed to process document with GROBID: ${parsingError.message}`
      );
      expect(mockParseStringPromise).toHaveBeenCalledWith('<invalid xml>');
    });

    it('should throw an error if section extraction fails', async () => {
      const extractionError = new Error('Cannot extract title');
      mockHttpService.post.mockReturnValue(of({ status: 200, data: mockTeiXml, headers: {}, config: {}, statusText: 'OK' }));
      mockParseStringPromise.mockResolvedValue(mockParsedXml);
      const extractSpy = jest.spyOn(teiParserService, 'extractSectionsFromTei').mockImplementation(() => {
        throw extractionError;
      });

      await expect(service.processDocument(fileBuffer, filename)).rejects.toThrow(
        `Failed to process document with GROBID: ${extractionError.message}`
      );
      expect(extractSpy).toHaveBeenCalledWith(mockParsedXml);
      extractSpy.mockRestore();
    });
  });

  describe('processWithLlm', () => {
    const llmRequest: LlmRequestDto = {
      prompt: 'Summarize this.',
      sections: {
        abstract: 'This is the abstract.',
        conclusion: 'This is the conclusion.',
      },
    };
    const mockLlmResponseText = 'This is the summary.';

    it('should call LLM and return result on success', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockLlmResponseText,
        },
      });

      const result = await service.processWithLlm(llmRequest);

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-1.5-flash' });
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(`User Prompt: ${llmRequest.prompt}`)
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(`Section: abstract\n${llmRequest.sections.abstract}`)
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(`Section: conclusion\n${llmRequest.sections.conclusion}`)
      );
      expect(result).toEqual({ result: mockLlmResponseText });
    });

    it('should throw an error if LLM call fails', async () => {
      const apiError = new Error('Google API Error');
      mockGenerateContent.mockRejectedValue(apiError);

      await expect(service.processWithLlm(llmRequest)).rejects.toThrow(
        `Failed to get response from LLM: ${apiError.message}`
      );
    });
  });
}); 