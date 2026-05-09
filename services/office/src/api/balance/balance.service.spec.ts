import { Test, TestingModule } from '@nestjs/testing';
import { BalanceService } from './balance.service';
import { Types } from 'mongoose';
import { Balance, BalanceHistory } from './balance.schema';
import { AppStatus } from '@core/helpers';
import { of } from 'rxjs';
import { BalanceException } from './balance.exception';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { LedgerRepository, Repository } from '@core/mongo';
import { GRPCService } from '@common/grpc/grpc.service';
import { AccountCurrency } from '@api/account/account.enums';
import { BalanceMode } from './balance.enums';
import { CreateAccountBalanceDto, CreateReserveAccountBalanceDto } from './balance.interface';

describe('BalanceService', () => {
    let service: BalanceService;
    let grpcService: GRPCService;
    let mockRepository: Repository<Balance>;
    let mockLedgerRepository: LedgerRepository<BalanceHistory>;

    const mockRequest = {
        tenantId: 'live',
        tenant: {
            dataSource: 'live',
            business: {
                id: 'business123',
            },
        },
    };

    const mockBalance = {
        id: '123',
        available: 1000,
        currency: AccountCurrency.NGN,
        mode: BalanceMode.Credit,
        overdraftLimit: 200,
    };

    const mockBalanceHistory = {
        id: '456',
        available: 1000,
        availableChange: 500,
        transaction: 'txn_123',
    };

    beforeEach(async () => {
        mockRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
        } as any;

        mockLedgerRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            findByQuery: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BalanceService,
                {
                    provide: REQUEST,
                    useValue: mockRequest,
                },
                {
                    provide: ModuleRef,
                    useValue: {
                        get: jest.fn((token, options) => {
                            if (token.includes(Balance.name)) {
                                return { model: 'balanceModel' };
                            }
                            if (token.includes(BalanceHistory.name)) {
                                return { model: 'balanceHistoryModel' };
                            }
                            return null;
                        }),
                    },
                },
                {
                    provide: GRPCService,
                    useValue: {
                        createBalance: jest.fn(),
                        getBalance: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BalanceService>(BalanceService);
        grpcService = module.get<GRPCService>(GRPCService);

        // Mock the repositories that are created in the constructor
        service.repo = mockRepository;
        service.historyRepo = mockLedgerRepository;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createBalance', () => {
        it('should create a balance and return the ObjectId on success', async () => {
            const dto = {
                pi: 'pi_123',
                piRef: 'Account',
                business: 'biz_123',
                currency: AccountCurrency.NGN,
                tenant: 'live.business123',
            };

            const mockResponse = {
                code: AppStatus.Success,
                data: { balanceId: '6091234567890123456789ab' },
                error: null,
            };

            jest.spyOn(grpcService, 'createBalance').mockReturnValue(of(mockResponse));

            // We need to access the private method
            const result = await (service as any).createBalance(dto);

            expect(grpcService.createBalance).toHaveBeenCalledWith(dto);
            expect(result).toBeInstanceOf(Types.ObjectId);
            expect(result.toString()).toBe('6091234567890123456789ab');
        });

        it('should return a new ObjectId when in dry run mode', async () => {
            const dto = {
                pi: 'pi_123',
                piRef: 'Account',
                business: 'biz_123',
                currency: AccountCurrency.NGN,
                tenant: 'live.business123',
            };

            const result = await (service as any).createBalance(dto, { dryRun: true });

            expect(grpcService.createBalance).not.toHaveBeenCalled();
            expect(result).toBeInstanceOf(Types.ObjectId);
        });

        it('should throw ISV_SERVICE_ERROR when gRPC returns an error', async () => {
            const dto = {
                pi: 'pi_123',
                piRef: 'Account',
                business: 'biz_123',
                currency: AccountCurrency.NGN,
                tenant: 'live.business123',
            };

            const mockErrorResponse = {
                code: AppStatus.BadRequest,
                data: null,
                error: 'Bad request',
            };

            jest.spyOn(grpcService, 'createBalance').mockReturnValue(of(mockErrorResponse));
            jest.spyOn(BalanceException, 'ISV_SERVICE_ERROR').mockImplementation((res) => {
                return new Error('ISV service error') as any;
            });

            await expect((service as any).createBalance(dto)).rejects.toThrow();
            expect(BalanceException.ISV_SERVICE_ERROR).toHaveBeenCalledWith(mockErrorResponse);
        });
    });

    describe('createAccountBalance', () => {
        it('should call createBalance and return ObjectId on success', async () => {
            const mockId = new Types.ObjectId();
            const dto: CreateAccountBalanceDto = {
                account: new Types.ObjectId('6091234567890123456789ab'),
                business: new Types.ObjectId('6091234567890123456789ac'),
                currency: AccountCurrency.NGN,
            };

            const mockResponse = {
                code: AppStatus.Success,
                data: { balanceId: mockId.toString() },
                error: null,
            };

            jest.spyOn(grpcService, 'createBalance').mockReturnValue(of(mockResponse));

            const result = await service.createAccountBalance(dto);

            expect(grpcService.createBalance).toHaveBeenCalled();
            expect(result).toEqual(mockId);
        });
    });

    describe('createReserveAccountBalance', () => {
        it('should call createBalance and return ObjectId on success', async () => {
            const mockId = new Types.ObjectId();
            const dto: CreateReserveAccountBalanceDto = {
                reserveAccount: new Types.ObjectId('6091234567890123456789ab'),
                currency: AccountCurrency.NGN,
            };

            const mockResponse = {
                code: AppStatus.Success,
                data: { balanceId: mockId.toString() },
                error: null,
            };

            jest.spyOn(grpcService, 'createBalance').mockReturnValue(of(mockResponse));

            const result = await service.createReserveAccountBalance(dto);

            expect(grpcService.createBalance).toHaveBeenCalled();
            expect(result).toEqual(mockId);
        });
    });

    describe('findAndVerify', () => {
        it('should get a balance by ID and return the gRPC response data on success', async () => {
            const balanceId = '6091234567890123456789ab';

            const mockResponse = {
                code: AppStatus.Success,
                data: mockBalance,
                error: null,
            };

            jest.spyOn(grpcService, 'getBalance').mockReturnValue(of(mockResponse));

            const result = await service.findAndVerify(balanceId);

            expect(grpcService.getBalance).toHaveBeenCalledWith({
                tenant: expect.any(String),
                id: balanceId,
            });
            expect(result).toEqual(mockBalance);
        });

        it('should throw ISV_SERVICE_ERROR when gRPC returns an error', async () => {
            const balanceId = '6091234567890123456789ab';

            const mockErrorResponse = {
                code: AppStatus.NotFound,
                data: null,
                error: 'Balance not found',
            };

            jest.spyOn(grpcService, 'getBalance').mockReturnValue(of(mockErrorResponse));
            jest.spyOn(BalanceException, 'ISV_SERVICE_ERROR').mockImplementation((res) => {
                return new Error('ISV service error') as any;
            });

            await expect(service.findAndVerify(balanceId)).rejects.toThrow();
            expect(BalanceException.ISV_SERVICE_ERROR).toHaveBeenCalledWith(mockErrorResponse);
        });
    });

    describe('ensureSufficientFunds', () => {
        it('should not throw exception when sufficient funds are available', async () => {
            const balanceId = new Types.ObjectId('6091234567890123456789ab');
            const amount = 800;

            const mockResponse = {
                code: AppStatus.Success,
                data: { available: 1000, overdraftLimit: 0 },
                available: 1000,
                overdraftLimit: 200,
            };

            jest.spyOn(service, 'findAndVerify').mockResolvedValue(mockResponse as any);

            // Mock the InsufficientFunds getter
            Object.defineProperty(BalanceException, 'InsufficientFunds', {
                get: jest.fn().mockReturnValue(new Error('Insufficient Funds')),
                configurable: true,
            });

            await expect(service.ensureSufficientFunds(balanceId, amount)).resolves.not.toThrow();
            expect(service.findAndVerify).toHaveBeenCalledWith(balanceId);
        });

        it('should throw InsufficientFunds when available balance is less than amount', async () => {
            const balanceId = new Types.ObjectId('6091234567890123456789ab');
            const amount = 1500;

            const mockResponse = {
                available: 1000,
            };

            jest.spyOn(service, 'findAndVerify').mockResolvedValue(mockResponse as any);

            // Mock the InsufficientFunds getter
            Object.defineProperty(BalanceException, 'InsufficientFunds', {
                get: jest.fn().mockReturnValue(new Error('Insufficient Funds')),
                configurable: true,
            });

            await expect(service.ensureSufficientFunds(balanceId, amount)).rejects.toThrow();
            expect(service.findAndVerify).toHaveBeenCalledWith(balanceId);
        });

        it('should throw InsufficientFunds when available balance + overdraft limit is less than amount', async () => {
            const balanceId = new Types.ObjectId('6091234567890123456789ab');
            const amount = 1500;

            const mockResponse = {
                available: 1000,
                overdraftLimit: 200,
            };

            jest.spyOn(service, 'findAndVerify').mockResolvedValue(mockResponse as any);

            // Mock the InsufficientFunds getter
            Object.defineProperty(BalanceException, 'InsufficientFunds', {
                get: jest.fn().mockReturnValue(new Error('Insufficient Funds')),
                configurable: true,
            });

            await expect(service.ensureSufficientFunds(balanceId, amount)).rejects.toThrow();
            expect(service.findAndVerify).toHaveBeenCalledWith(balanceId);
        });
    });

    describe('isSufficientFunds', () => {
        it('should return true when available balance is sufficient', async () => {
            const balanceId = new Types.ObjectId('6091234567890123456789ab');
            const amount = 500;

            const mockResponse = {
                available: 1000,
            };

            jest.spyOn(service, 'findAndVerify').mockResolvedValue(mockResponse as any);

            const result = await service.isSufficientFunds(balanceId, amount);
            expect(result).toBe(true);
            expect(service.findAndVerify).toHaveBeenCalledWith(balanceId);
        });

        it('should return false when available balance is less than amount', async () => {
            const balanceId = new Types.ObjectId('6091234567890123456789ab');
            const amount = 1500;

            const mockResponse = {
                available: 1000,
            };

            jest.spyOn(service, 'findAndVerify').mockResolvedValue(mockResponse as any);

            const result = await service.isSufficientFunds(balanceId, amount);
            expect(result).toBe(false);
            expect(service.findAndVerify).toHaveBeenCalledWith(balanceId);
        });

        it('should consider overdraft limit when checking balance', async () => {
            const balanceId = new Types.ObjectId('6091234567890123456789ab');
            const amount = 1200;

            const mockResponse = {
                available: 1000,
                overdraftLimit: 300,
            };

            jest.spyOn(service, 'findAndVerify').mockResolvedValue(mockResponse as any);

            const result = await service.isSufficientFunds(balanceId, amount);
            expect(result).toBe(true);
            expect(service.findAndVerify).toHaveBeenCalledWith(balanceId);
        });

        it('should return false when available balance + overdraft limit is less than amount', async () => {
            const balanceId = new Types.ObjectId('6091234567890123456789ab');
            const amount = 1500;

            const mockResponse = {
                available: 1000,
                overdraftLimit: 300,
            };

            jest.spyOn(service, 'findAndVerify').mockResolvedValue(mockResponse as any);

            const result = await service.isSufficientFunds(balanceId, amount);
            expect(result).toBe(false);
            expect(service.findAndVerify).toHaveBeenCalledWith(balanceId);
        });
    });

    describe('getHistory', () => {
        it('should call historyRepo.findByQuery with correct parameters', async () => {
            const balanceId = new Types.ObjectId('6091234567890123456789ab');
            const query = { skip: 0, limit: 10 };

            jest.spyOn(mockLedgerRepository, 'findByQuery').mockResolvedValue([mockBalanceHistory] as any);

            const result = await service.getHistory(balanceId, query);

            expect(mockLedgerRepository.findByQuery).toHaveBeenCalledWith(query, { '_meta.origId': balanceId });
            expect(result).toEqual([mockBalanceHistory]);
        });
    });
});
