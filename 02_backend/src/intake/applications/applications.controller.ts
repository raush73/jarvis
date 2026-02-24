import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminOnly } from '../../auth/admin-only.decorator';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Controller('admin/applications')
@UseGuards(AuthGuard('jwt'))
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @AdminOnly()
  @Post()
  create(@Body() dto: CreateApplicationDto, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.applicationsService.create(dto, userId);
  }

  @AdminOnly()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  @AdminOnly()
  @Post(':id/submit')
  submit(@Param('id') id: string) {
    return this.applicationsService.submit(id);
  }

  @AdminOnly()
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.applicationsService.approve(id, userId, dto);
  }

  @AdminOnly()
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.applicationsService.reject(id, userId, dto);
  }

  @AdminOnly()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @AdminOnly()
  @Get()
  findAll(@Query('status') status?: ApplicationStatus) {
    return this.applicationsService.findAll(status);
  }
}

