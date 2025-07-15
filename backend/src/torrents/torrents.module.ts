import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { YtsService } from './yts.service';
import { TransmissionService } from './transmission.service';

@Module({
  imports: [HttpModule],
  providers: [YtsService, TransmissionService],
  exports: [YtsService, TransmissionService],
})
export class TorrentsModule {}