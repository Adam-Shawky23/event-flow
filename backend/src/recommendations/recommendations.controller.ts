import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get()
  @UseGuards(JwtGuard)
  async getRecommendations(@GetUser() user: any) {
    return this.recommendationsService.getRecommendations(user.sub);
  }

  @Get('public')
  async getPublicRecommendations() {
    return this.recommendationsService.getRecommendations(0);
  }
}