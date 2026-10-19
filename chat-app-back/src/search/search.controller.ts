import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findOne(@Query() query: { query: string }, @Req() request: RequestWithUser) {
    return this.searchService.findByQuery(query.query, request.user._id.toString());
  }
}
