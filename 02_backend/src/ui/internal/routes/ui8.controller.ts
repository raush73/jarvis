import { Controller, Get, Header } from '@nestjs/common';
import { Roles } from '../../../auth/authz/authz.decorators';

@Controller('ui/internal/ui8')
export class Ui8Controller {
  @Get('authz-smoke')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  authzSmoke() {
    return '<!doctype html><html><body><h1>AUTHZ OK</h1></body></html>';
  }
}
