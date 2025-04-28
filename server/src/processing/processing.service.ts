import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import * as xml2js from 'xml2js';
import { LlmRequestDto } from './dto/llm-request.dto';
import { TeiParserService } from './tei-parser.service';

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);
  private readonly grobidUrl: string;
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly teiParserService: TeiParserService,
  ) {
    this.grobidUrl = this.configService.get<string>('GROBID_URL', 'http://localhost:8070');
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');

    if (!apiKey) {
      this.logger.error('GOOGLE_API_KEY is not configured in environment variables.');
      throw new Error('Missing Google API Key configuration.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log('ProcessingService initialized, GROBID URL: ' + this.grobidUrl);
  }

  async processDocument(fileBuffer: Buffer, filename: string): Promise<any> {
    this.logger.log(`Processing document via GROBID: ${filename}`);
    const grobidApiUrl = `${this.grobidUrl}/api/processFulltextDocument`;

    const formData = new FormData();
    formData.append('input', fileBuffer, {
      filename: filename,
      contentType: 'application/pdf',
    });

    try {
      this.logger.log(`Sending request to GROBID at ${grobidApiUrl}`);
      const response = await firstValueFrom(
        this.httpService.post(grobidApiUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            'Accept': 'application/xml'
          },
          responseType: 'text'
        }),
      );

      this.logger.log(`Received response from GROBID (status: ${response.status})`);

      if (response.status !== 200) {
        this.logger.error(`GROBID returned error status: ${response.status}`);
        throw new Error(`GROBID processing failed with status ${response.status}`);
      }

      this.logger.log('Parsing GROBID TEI XML response.');
      const parser = new xml2js.Parser({ explicitArray: false });
      const parsedXml = await parser.parseStringPromise(response.data);

      this.logger.log('Successfully parsed TEI XML.');

      const sections = this.teiParserService.extractSectionsFromTei(parsedXml);

      return {
        message: 'File processed successfully by GROBID.',
        sections: sections
      };
    } catch (error) {
      this.logger.error(
        `Caught error in processDocument: ${error?.constructor?.name} - ${error.message}`,
        error.stack
      );
      if (error.response) {
        this.logger.error(`GROBID Error Response Data: ${error.response.data}`);
      }
      throw new Error(`Failed to process document with GROBID: ${error.message}`);
    }
  }

  async processWithLlm(llmRequest: LlmRequestDto): Promise<{ result: string }> {
    this.logger.log(`Processing request with LLM. Prompt: "${llmRequest.prompt.substring(0, 50)}...", Sections: ${Object.keys(llmRequest.sections).join(', ')}`);

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let formattedInput = `User Prompt: ${llmRequest.prompt}\n\n`;
    formattedInput += "Selected Document Sections:\n---\n";
    for (const sectionName in llmRequest.sections) {
      formattedInput += `Section: ${sectionName}\n${llmRequest.sections[sectionName]}\n---\n`;
    }

    try {
      const result = await model.generateContent(formattedInput);
      const response = result.response;
      const text = response.text();

      this.logger.log('Successfully received response from LLM.');
      return { result: text };
    } catch (error) {
      this.logger.error(`Error calling Google Generative AI: ${error.message}`, error.stack);
      if (error.response?.promptFeedback) {
        this.logger.error('LLM Prompt Feedback:', JSON.stringify(error.response.promptFeedback));
      }
      throw new Error(`Failed to get response from LLM: ${error.message}`);
    }
  }
} 