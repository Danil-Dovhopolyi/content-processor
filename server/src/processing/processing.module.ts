import { Module } from '@nestjs/common';
import { ProcessingController } from './processing.controller';
import { HttpModule } from '@nestjs/axios';
import { ProcessingService } from './processing.service';
import { TeiParserService } from './tei-parser.service';

@Module({
  imports: [HttpModule],
  controllers: [ProcessingController],
  providers: [
    ProcessingService,
    TeiParserService
  ]
})
export class ProcessingModule { } 