import { Module } from '@nestjs/common';
import { SessionTaskModule } from './queues/cronjob/session-task.module';
import { EmailQueueModule } from './queues/email-queue/email-queue.module';
@Module({
  imports: [EmailQueueModule, SessionTaskModule],
})
export class BackgroundModule {}
