import { Test, TestingModule } from '@nestjs/testing';
import { PayrollRunService } from './payroll-run.service';

describe('PayrollRunService', () => {
  let service: PayrollRunService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollRunService],
    }).compile();

    service = module.get<PayrollRunService>(PayrollRunService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
