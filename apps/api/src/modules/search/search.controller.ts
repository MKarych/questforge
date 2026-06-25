import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') query?: string, @Query('limit') limit?: number) {
    const results = await this.searchService.search(query || '', limit ? Number(limit) : 10);
    return results;
  }
}