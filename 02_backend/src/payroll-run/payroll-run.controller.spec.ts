import { Test, TestingModule } from '@nestjs/testing';
import { PayrollRunController } from './payroll-run.controller';

describe('PayrollRunController', () => {
  let controller: PayrollRunController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollRunController],
    }).compile();

    controller = module.get<PayrollRunController>(PayrollRunController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
