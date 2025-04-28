import { Body, Controller, Post, UploadedFile, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LlmRequestDto } from './dto/llm-request.dto';
import { ProcessingService } from './processing.service';

@Controller('processing')
export class ProcessingController {
  constructor(private readonly processingService: ProcessingService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async processPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new Error('Invalid file type. Only PDF is allowed.');
    }

    return this.processingService.processDocument(file.buffer, file.originalname);
  }

  @Post('llm')
  async processWithLlm(@Body(new ValidationPipe({ transform: true })) llmRequestDto: LlmRequestDto) {
    return this.processingService.processWithLlm(llmRequestDto);
  }
} 