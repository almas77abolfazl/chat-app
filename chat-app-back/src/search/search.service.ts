import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  findOne(id: string) {
    console.log(id);
  }
}
