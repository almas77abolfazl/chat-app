import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as useragent from 'express-useragent';
@Injectable()
export class UserAgentMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    useragent.express()(req, res, next);
    req['useragent'].deviceNameAndIp = req.ip + '/' + req['useragent'].source;
  }
}
