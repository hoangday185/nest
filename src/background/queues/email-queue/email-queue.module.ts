import { QueueName, QueuePrefix } from '@/constants/job.constants';
import { MailModule } from '@/mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailQueueEvents } from './email-queue.events';
import { EmailProcessor } from './email-queue.processor';
import { EmailQueueService } from './email-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.EMAIL,
      prefix: QueuePrefix.AUTH,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
    MailModule,
  ],
  providers: [EmailQueueService, EmailProcessor, EmailQueueEvents],
})
export class EmailQueueModule {}
