import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsReportService } from './commissions-report.service';

describe('CommissionsReportService', () => {
  let service: CommissionsReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionsReportService],
    }).compile();

    service = module.get<CommissionsReportService>(CommissionsReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
