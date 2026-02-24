import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { ListCandidatesQueryDto } from './dto/list-candidates.query.dto';
import { UpdateCandidateAvailabilityDto } from './dto/update-candidate-availability.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Controller('candidates')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  // Phase 21.2/21.3: list candidates with optional filters
  @Get()
  @Permissions(PERMISSIONS.CANDIDATES_READ)
  async list(
    @Query() query: ListCandidatesQueryDto,
  ): Promise<Array<{ id: string; status: string }>> {
    return this.candidatesService.listCandidates(query);
  }

  // Phase 21.3: admin-only create (permission-gated)
  @Post()
  @Permissions(PERMISSIONS.CANDIDATES_WRITE)
  async create(@Body() dto: CreateCandidateDto): Promise<{ ok: true; id: string }> {
    return this.candidatesService.createCandidate(dto);
  }

  // Phase 21.3: admin-only read full candidate record
  @Get(':id')
  @Permissions(PERMISSIONS.CANDIDATES_READ)
  async getById(
    @Param('id') candidateId: string,
  ): Promise<{
    id: string;
    status: string;
    phone: string | null;
    email: string | null;
    tools: string;
    ppe: string;
    safetyRecords: string;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.candidatesService.getCandidateById(candidateId);
  }

  // Phase 21.5 (stub): candidate recommendations (no logic yet)
  @Get(':id/recommendations')
  @Permissions(PERMISSIONS.CANDIDATES_READ)
  async getRecommendations(
    @Param('id') candidateId: string,
    @Query('orderId') orderId?: string,
  ): Promise<{ ok: true; items: any[] }> {
    return this.candidatesService.getCandidateRecommendations(candidateId, orderId);
  }

  // Option B: admin-only update candidate profile + markers (permission-gated)
  @Patch(':id')
  @Permissions(PERMISSIONS.CANDIDATES_WRITE)
  async updateCandidate(
    @Param('id') candidateId: string,
    @Body() dto: UpdateCandidateDto,
  ): Promise<{ ok: true }> {
    return this.candidatesService.updateCandidate(candidateId, dto);
  }

  // Phase 21.2: get availability (deterministic)
  @Get(':id/availability')
  @Permissions(PERMISSIONS.CANDIDATES_READ)
  async getAvailability(
    @Param('id') candidateId: string,
  ): Promise<{ status: string }> {
    return this.candidatesService.getAvailability(candidateId);
  }

  // Phase 21.2: set availability (deterministic)
  @Patch(':id/availability')
  @Permissions(PERMISSIONS.CANDIDATES_WRITE)
  async setAvailability(
    @Param('id') candidateId: string,
    @Body() dto: UpdateCandidateAvailabilityDto,
  ): Promise<{ ok: true; status: string }> {
    return this.candidatesService.setAvailability(candidateId, dto.status);
  }
}
