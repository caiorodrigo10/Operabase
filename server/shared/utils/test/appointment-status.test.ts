/**
 * Simple Test Script for Appointment Status Utilities
 * 
 * Run with: npx tsx server/shared/utils/test/appointment-status.test.ts
 * This tests the appointment status functions before implementing changes.
 */

import {
  isAppointmentBlocking,
  isAppointmentCancelled,
  isTimeSlotAvailable,
  getCancelledStatusList,
  getBlockingStatusList,
  getCancelledStatusSQLCondition,
  getNonBlockingSQLCondition
} from '../appointment-status';

// Simple test runner
class TestRunner {
  private passed = 0;
  private failed = 0;
  private currentSuite = '';

  describe(name: string, fn: () => void) {
    this.currentSuite = name;
    console.log(`\n📋 ${name}`);
    fn();
  }

  it(name: string, fn: () => void) {
    try {
      fn();
      this.passed++;
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error}`);
    }
  }

  expect(actual: any) {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toContain: (expected: any) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}, got ${actual}`);
        }
      },
      toHaveLength: (expected: number) => {
        if (actual.length !== expected) {
          throw new Error(`Expected length ${expected}, got ${actual.length}`);
        }
      }
    };
  }

  run() {
    console.log('🧪 Running Appointment Status Utility Tests\n');
    this.runTests();
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      console.log('❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('✅ All tests passed!');
      process.exit(0);
    }
  }

  private runTests() {
    // Test isAppointmentBlocking
    this.describe('isAppointmentBlocking', () => {
      this.it('should return true for blocking statuses', () => {
        this.expect(isAppointmentBlocking('agendada')).toBe(true);
        this.expect(isAppointmentBlocking('confirmada')).toBe(true);
        this.expect(isAppointmentBlocking('realizada')).toBe(true);
      });

      this.it('should return false for cancelled statuses', () => {
        this.expect(isAppointmentBlocking('cancelada')).toBe(false);
        this.expect(isAppointmentBlocking('cancelada_paciente')).toBe(false);
        this.expect(isAppointmentBlocking('cancelada_dentista')).toBe(false);
      });

      this.it('should return false for non-blocking statuses', () => {
        this.expect(isAppointmentBlocking('faltou')).toBe(false);
      });

      this.it('should return false for unknown statuses', () => {
        this.expect(isAppointmentBlocking('unknown_status')).toBe(false);
      });
    });

    // Test isAppointmentCancelled
    this.describe('isAppointmentCancelled', () => {
      this.it('should return true for all cancelled statuses', () => {
        this.expect(isAppointmentCancelled('cancelada')).toBe(true);
        this.expect(isAppointmentCancelled('cancelada_paciente')).toBe(true);
        this.expect(isAppointmentCancelled('cancelada_dentista')).toBe(true);
      });

      this.it('should return false for non-cancelled statuses', () => {
        this.expect(isAppointmentCancelled('agendada')).toBe(false);
        this.expect(isAppointmentCancelled('confirmada')).toBe(false);
        this.expect(isAppointmentCancelled('realizada')).toBe(false);
        this.expect(isAppointmentCancelled('faltou')).toBe(false);
      });

      this.it('should return false for unknown statuses', () => {
        this.expect(isAppointmentCancelled('unknown_status')).toBe(false);
      });
    });

    // Test isTimeSlotAvailable
    this.describe('isTimeSlotAvailable', () => {
      this.it('should return true for cancelled appointments', () => {
        this.expect(isTimeSlotAvailable('cancelada')).toBe(true);
        this.expect(isTimeSlotAvailable('cancelada_paciente')).toBe(true);
        this.expect(isTimeSlotAvailable('cancelada_dentista')).toBe(true);
      });

      this.it('should return true for no-show appointments', () => {
        this.expect(isTimeSlotAvailable('faltou')).toBe(true);
      });

      this.it('should return false for active appointments', () => {
        this.expect(isTimeSlotAvailable('agendada')).toBe(false);
        this.expect(isTimeSlotAvailable('confirmada')).toBe(false);
        this.expect(isTimeSlotAvailable('realizada')).toBe(false);
      });

      this.it('should return false for unknown statuses', () => {
        this.expect(isTimeSlotAvailable('unknown_status')).toBe(false);
      });
    });

    // Test helper functions
    this.describe('Helper Functions', () => {
      this.it('should return correct cancelled status list', () => {
        const statuses = getCancelledStatusList();
        this.expect(statuses).toContain('cancelada');
        this.expect(statuses).toContain('cancelada_paciente');
        this.expect(statuses).toContain('cancelada_dentista');
        this.expect(statuses).toHaveLength(3);
      });

      this.it('should return correct blocking status list', () => {
        const statuses = getBlockingStatusList();
        this.expect(statuses).toContain('agendada');
        this.expect(statuses).toContain('confirmada');
        this.expect(statuses).toContain('realizada');
        this.expect(statuses).toHaveLength(3);
      });

      this.it('should generate correct SQL conditions', () => {
        const cancelledCondition = getCancelledStatusSQLCondition();
        this.expect(cancelledCondition).toBe("('cancelada', 'cancelada_paciente', 'cancelada_dentista')");

        const nonBlockingCondition = getNonBlockingSQLCondition();
        this.expect(nonBlockingCondition).toBe("NOT IN ('agendada', 'confirmada', 'realizada')");
      });
    });

    // Integration tests
    this.describe('Integration Tests - Availability Logic', () => {
      this.it('should correctly identify time slots that can be reused', () => {
        const cancelledAppointments = [
          { status: 'cancelada' },
          { status: 'cancelada_paciente' },
          { status: 'cancelada_dentista' },
          { status: 'faltou' }
        ];

        cancelledAppointments.forEach(apt => {
          this.expect(isTimeSlotAvailable(apt.status)).toBe(true);
          this.expect(isAppointmentBlocking(apt.status)).toBe(false);
        });
      });

      this.it('should correctly identify time slots that are blocked', () => {
        const activeAppointments = [
          { status: 'agendada' },
          { status: 'confirmada' },
          { status: 'realizada' }
        ];

        activeAppointments.forEach(apt => {
          this.expect(isTimeSlotAvailable(apt.status)).toBe(false);
          this.expect(isAppointmentBlocking(apt.status)).toBe(true);
        });
      });
    });

    // Edge cases
    this.describe('Edge Cases', () => {
      this.it('should handle null and undefined values safely', () => {
        this.expect(isAppointmentBlocking(null as any)).toBe(false);
        this.expect(isAppointmentBlocking(undefined as any)).toBe(false);
        this.expect(isAppointmentCancelled(null as any)).toBe(false);
        this.expect(isAppointmentCancelled(undefined as any)).toBe(false);
        this.expect(isTimeSlotAvailable(null as any)).toBe(false);
        this.expect(isTimeSlotAvailable(undefined as any)).toBe(false);
      });

      this.it('should handle empty strings', () => {
        this.expect(isAppointmentBlocking('')).toBe(false);
        this.expect(isAppointmentCancelled('')).toBe(false);
        this.expect(isTimeSlotAvailable('')).toBe(false);
      });

      this.it('should be case sensitive', () => {
        this.expect(isAppointmentCancelled('CANCELADA')).toBe(false);
        this.expect(isAppointmentCancelled('Cancelada')).toBe(false);
        this.expect(isAppointmentBlocking('AGENDADA')).toBe(false);
      });
    });
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  runner.run();
} 