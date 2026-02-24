// PHASE 12.3 — Assignments Controller
// LOCKED SCOPE: operations only (no hours, no billing, no payroll, no accounting)

import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssignmentsService } from './assignments.service';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Permissions(PERMISSIONS.ASSIGNMENTS_WRITE)
  @Post()
  create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(dto);
  }

  @Permissions(PERMISSIONS.ASSIGNMENTS_WRITE)
  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.assignmentsService.close(id);
  }

  // Phase 20 — Assignment status transitions
  @Permissions(PERMISSIONS.ASSIGNMENTS_WRITE)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'DISPATCHED' | 'ON_ASSIGNMENT' | 'COMPLETED' },
  ) {
    return this.assignmentsService.updateAssignmentStatus(id, body.status);
  }
}
