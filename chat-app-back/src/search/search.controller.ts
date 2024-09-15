import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  findOne(@Query() query: { query: string }) {
    return this.searchService.findByQuery(query.query);
  }
}
