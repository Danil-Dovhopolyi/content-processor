import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class LlmRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsObject()
  @IsNotEmpty()
  sections: Record<string, string>;
} 