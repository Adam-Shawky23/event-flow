import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('messages')
@UseGuards(JwtGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  send(@Body() dto: CreateMessageDto, @GetUser() user: any) {
    return this.messagesService.send(dto, user.sub);
  }

  @Get('inbox')
  getInbox(@GetUser() user: any) {
    return this.messagesService.getInbox(user.sub);
  }

  @Get('sent')
  getSent(@GetUser() user: any) {
    return this.messagesService.getSent(user.sub);
  }

  @Get('unread-count')
  getUnreadCount(@GetUser() user: any) {
    return this.messagesService.getUnreadCount(user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.messagesService.markAsRead(id, user.sub);
  }

  @Delete(':id/inbox')
  deleteFromInbox(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.messagesService.deleteFromInbox(id, user.sub);
  }

  @Delete(':id/sent')
  deleteFromSent(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.messagesService.deleteFromSent(id, user.sub);
  }

  @Post('notify-cancellation/:eventId')
  notifyEventCancellation(
    @Param('eventId', ParseIntPipe) eventId: number,
    @GetUser() user: any,
  ) {
    return this.messagesService.notifyEventCancellation(eventId, user.sub);
  }
}