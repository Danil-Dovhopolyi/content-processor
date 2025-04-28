import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProcessingModule } from './processing/processing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ProcessingModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
