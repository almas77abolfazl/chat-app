import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SearchService {
  constructor(private userService: UserService) {}

  findByQuery(query: string) {
    return this.userService.findUsersByQuery(query);
  }
}
