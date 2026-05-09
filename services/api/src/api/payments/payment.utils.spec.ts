import { HydratedDocument } from 'mongoose';
import { PaymentTimelineAction } from './payment.enums';
import { isPaymentFundsDebited } from './payment.utils';
import { Payment } from './payment.schema';

describe('payment.utils', () => {
    describe('isPaymentFundsDebited', () => {
        it('should return true when payment has a timeline entry with FundsDebited action', () => {
            // Arrange
            const payment = {
                timeline: [
                    { action: PaymentTimelineAction.Initiated, timestamp: new Date() },
                    { action: PaymentTimelineAction.FundsDebited, timestamp: new Date() },
                    { action: PaymentTimelineAction.SentForReversal, timestamp: new Date() },
                ],
            } as unknown as HydratedDocument<Payment>;

            // Act
            const result = isPaymentFundsDebited(payment);

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when payment has a timeline but no FundsDebited entry', () => {
            // Arrange
            const payment = {
                timeline: [
                    { action: PaymentTimelineAction.Initiated, timestamp: new Date() },
                    { action: PaymentTimelineAction.SentForReversal, timestamp: new Date() },
                ],
            } as unknown as HydratedDocument<Payment>;

            // Act
            const result = isPaymentFundsDebited(payment);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when payment has an empty timeline', () => {
            // Arrange
            const payment = {
                timeline: [],
            } as unknown as HydratedDocument<Payment>;

            // Act
            const result = isPaymentFundsDebited(payment);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when payment has no timeline property', () => {
            // Arrange
            const payment = {} as unknown as HydratedDocument<Payment>;

            // Act
            const result = isPaymentFundsDebited(payment);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when payment has null timeline', () => {
            // Arrange
            const payment = {
                timeline: null,
            } as unknown as HydratedDocument<Payment>;

            // Act
            const result = isPaymentFundsDebited(payment);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when payment has undefined timeline', () => {
            // Arrange
            const payment = {
                timeline: undefined,
            } as unknown as HydratedDocument<Payment>;

            // Act
            const result = isPaymentFundsDebited(payment);

            // Assert
            expect(result).toBe(false);
        });
    });
});
