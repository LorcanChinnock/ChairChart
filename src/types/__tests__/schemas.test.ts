import { describe, it, expect } from 'vitest'
import {
  Vec2Schema,
  TableShapeSchema,
  AttendeeSchema,
  TableSchema,
  SeatAssignmentSchema,
  PlanSchema,
} from '../index'
import type {
  Vec2,
  TableShape,
  Attendee,
  Table,
  SeatAssignment,
  Plan,
} from '../index'

describe('Type Schemas and Validation', () => {
  describe('Vec2Schema', () => {
    it('should validate correct Vec2 objects', () => {
      const validVec2s = [
        { x: 0, y: 0 },
        { x: 100, y: 200 },
        { x: -50, y: -75 },
        { x: 3.14, y: 2.71 },
      ]
      
      validVec2s.forEach(vec => {
        expect(() => Vec2Schema.parse(vec)).not.toThrow()
        const result = Vec2Schema.parse(vec)
        expect(result).toEqual(vec)
      })
    })

    it('should reject invalid Vec2 objects', () => {
      const invalidVec2s = [
        { x: 'not a number', y: 0 },
        { x: 0, y: 'not a number' },
        { x: 0 }, // missing y
        { y: 0 }, // missing x
        {},
        null,
        undefined,
        'string',
        123,
      ]
      
      invalidVec2s.forEach(vec => {
        expect(() => Vec2Schema.parse(vec)).toThrow()
      })
    })
  })

  describe('TableShapeSchema', () => {
    it('should validate correct table shapes', () => {
      const validShapes: TableShape[] = ['round', 'rect', 'square']
      
      validShapes.forEach(shape => {
        expect(() => TableShapeSchema.parse(shape)).not.toThrow()
        const result = TableShapeSchema.parse(shape)
        expect(result).toBe(shape)
      })
    })

    it('should reject invalid table shapes', () => {
      const invalidShapes = [
        'circle',
        'rectangle',
        'triangle',
        'oval',
        '',
        null,
        undefined,
        123,
        {},
      ]
      
      invalidShapes.forEach(shape => {
        expect(() => TableShapeSchema.parse(shape)).toThrow()
      })
    })
  })

  describe('AttendeeSchema', () => {
    it('should validate correct attendee objects', () => {
      const validAttendees: Attendee[] = [
        {
          id: 'attendee-1',
          name: 'John Doe',
        },
        {
          id: 'attendee-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          notes: 'Vegetarian',
        },
        {
          id: 'attendee-3',
          name: 'Bob Johnson',
          email: 'bob@test.org',
        },
      ]
      
      validAttendees.forEach(attendee => {
        expect(() => AttendeeSchema.parse(attendee)).not.toThrow()
        const result = AttendeeSchema.parse(attendee)
        expect(result).toEqual(attendee)
      })
    })

    it('should reject attendees with invalid email formats', () => {
      const invalidEmails = [
        { id: 'test', name: 'Test', email: 'not-an-email' },
        { id: 'test', name: 'Test', email: 'missing@' },
        { id: 'test', name: 'Test', email: '@missing.com' },
        { id: 'test', name: 'Test', email: 'spaces in@email.com' },
      ]
      
      invalidEmails.forEach(attendee => {
        expect(() => AttendeeSchema.parse(attendee)).toThrow()
      })
    })

    it('should reject attendees missing required fields', () => {
      const invalidAttendees = [
        { name: 'Missing ID' }, // no id
        { id: 'test' }, // no name
        {}, // no required fields
        { id: '', name: 'Empty ID' }, // empty id
        { id: 'test', name: '' }, // empty name
      ]
      
      invalidAttendees.forEach(attendee => {
        expect(() => AttendeeSchema.parse(attendee)).toThrow()
      })
    })
  })

  describe('TableSchema', () => {
    it('should validate correct table objects', () => {
      const validTables: Table[] = [
        {
          id: 'table-1',
          name: 'Head Table',
          shape: 'round',
          position: { x: 0, y: 0 },
          seatCount: 8,
          rotation: 0,
          size: { width: 100, height: 100 },
        },
        {
          id: 'table-2',
          name: 'Table 2',
          shape: 'rect',
          position: { x: 200, y: 300 },
          seatCount: 12,
          rotation: 45,
          size: { width: 160, height: 80 },
        },
        {
          id: 'table-3',
          name: 'Square Table',
          shape: 'square',
          position: { x: -100, y: -200 },
          seatCount: 4,
          size: { width: 120, height: 120 },
          // rotation should default to 0
        },
      ]
      
      validTables.forEach(table => {
        expect(() => TableSchema.parse(table)).not.toThrow()
        const result = TableSchema.parse(table)
        expect(result.rotation).toBeDefined() // Should have default value
      })
    })

    it('should enforce seat count limits', () => {
      const invalidSeatCounts = [
        { ...createValidTable(), seatCount: 0 },
        { ...createValidTable(), seatCount: -1 },
        { ...createValidTable(), seatCount: 21 },
        { ...createValidTable(), seatCount: 100 },
      ]
      
      invalidSeatCounts.forEach(table => {
        expect(() => TableSchema.parse(table)).toThrow()
      })
    })

    it('should enforce positive size dimensions', () => {
      const invalidSizes = [
        { ...createValidTable(), size: { width: 0, height: 100 } },
        { ...createValidTable(), size: { width: 100, height: 0 } },
        { ...createValidTable(), size: { width: -50, height: 100 } },
        { ...createValidTable(), size: { width: 100, height: -50 } },
      ]
      
      invalidSizes.forEach(table => {
        expect(() => TableSchema.parse(table)).toThrow()
      })
    })

    it('should apply default rotation value', () => {
      const tableWithoutRotation = {
        id: 'test-table',
        name: 'Test Table',
        shape: 'round' as TableShape,
        position: { x: 0, y: 0 },
        seatCount: 4,
        size: { width: 100, height: 100 },
      }
      
      const result = TableSchema.parse(tableWithoutRotation)
      expect(result.rotation).toBe(0)
    })
  })

  describe('SeatAssignmentSchema', () => {
    it('should validate correct seat assignment objects', () => {
      const validAssignments: SeatAssignment[] = [
        {
          tableId: 'table-1',
          seatNumber: 1,
          attendeeId: 'attendee-1',
        },
        {
          tableId: 'table-2',
          seatNumber: 10,
          attendeeId: null, // Unassigned seat
        },
        {
          tableId: 'table-3',
          seatNumber: 20,
          attendeeId: 'attendee-3',
        },
      ]
      
      validAssignments.forEach(assignment => {
        expect(() => SeatAssignmentSchema.parse(assignment)).not.toThrow()
        const result = SeatAssignmentSchema.parse(assignment)
        expect(result).toEqual(assignment)
      })
    })

    it('should enforce seat number limits', () => {
      const invalidSeatNumbers = [
        { tableId: 'table-1', seatNumber: 0, attendeeId: 'test' },
        { tableId: 'table-1', seatNumber: -1, attendeeId: 'test' },
        { tableId: 'table-1', seatNumber: 21, attendeeId: 'test' },
        { tableId: 'table-1', seatNumber: 100, attendeeId: 'test' },
      ]
      
      invalidSeatNumbers.forEach(assignment => {
        expect(() => SeatAssignmentSchema.parse(assignment)).toThrow()
      })
    })

    it('should allow null attendeeId for unassigned seats', () => {
      const unassignedSeat = {
        tableId: 'table-1',
        seatNumber: 5,
        attendeeId: null,
      }
      
      expect(() => SeatAssignmentSchema.parse(unassignedSeat)).not.toThrow()
      const result = SeatAssignmentSchema.parse(unassignedSeat)
      expect(result.attendeeId).toBe(null)
    })
  })

  describe('PlanSchema', () => {
    it('should validate complete plan objects', () => {
      const validPlan: Plan = {
        id: 'plan-1',
        name: 'Wedding Reception',
        description: 'Seating plan for John and Jane wedding',
        tables: [
          {
            id: 'table-1',
            name: 'Head Table',
            shape: 'round',
            position: { x: 0, y: 0 },
            seatCount: 8,
            rotation: 0,
            size: { width: 100, height: 100 },
          },
        ],
        attendees: [
          {
            id: 'attendee-1',
            name: 'John Doe',
            email: 'john@example.com',
          },
        ],
        seatAssignments: [
          {
            tableId: 'table-1',
            seatNumber: 1,
            attendeeId: 'attendee-1',
          },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }
      
      expect(() => PlanSchema.parse(validPlan)).not.toThrow()
      const result = PlanSchema.parse(validPlan)
      expect(result).toEqual(validPlan)
    })

    it('should validate plans with empty arrays', () => {
      const emptyPlan = {
        id: 'empty-plan',
        name: 'Empty Plan',
        tables: [],
        attendees: [],
        seatAssignments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      expect(() => PlanSchema.parse(emptyPlan)).not.toThrow()
    })

    it('should reject plans missing required fields', () => {
      const invalidPlans = [
        { name: 'Missing fields' }, // missing required fields
        { id: '', name: 'Empty ID', tables: [], attendees: [], seatAssignments: [], createdAt: new Date(), updatedAt: new Date() },
        { id: 'test', name: '', tables: [], attendees: [], seatAssignments: [], createdAt: new Date(), updatedAt: new Date() },
      ]
      
      invalidPlans.forEach(plan => {
        expect(() => PlanSchema.parse(plan)).toThrow()
      })
    })

    it('should handle optional description field', () => {
      const planWithDescription = {
        id: 'plan-1',
        name: 'Test Plan',
        description: 'Test description',
        tables: [],
        attendees: [],
        seatAssignments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      const planWithoutDescription = {
        id: 'plan-2',
        name: 'Test Plan',
        tables: [],
        attendees: [],
        seatAssignments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      expect(() => PlanSchema.parse(planWithDescription)).not.toThrow()
      expect(() => PlanSchema.parse(planWithoutDescription)).not.toThrow()
      
      const result1 = PlanSchema.parse(planWithDescription)
      const result2 = PlanSchema.parse(planWithoutDescription)
      
      expect(result1.description).toBe('Test description')
      expect(result2.description).toBeUndefined()
    })
  })

  describe('Complex validation scenarios', () => {
    it('should validate large plans with many tables and attendees', () => {
      const largePlan = {
        id: 'large-plan',
        name: 'Large Event',
        tables: Array.from({ length: 25 }, (_, i) => ({
          id: `table-${i + 1}`,
          name: `Table ${i + 1}`,
          shape: 'round' as TableShape,
          position: { x: i * 200, y: Math.floor(i / 5) * 200 },
          seatCount: 8,
          rotation: 0,
          size: { width: 100, height: 100 },
        })),
        attendees: Array.from({ length: 200 }, (_, i) => ({
          id: `attendee-${i + 1}`,
          name: `Guest ${i + 1}`,
          email: `guest${i + 1}@example.com`,
        })),
        seatAssignments: Array.from({ length: 200 }, (_, i) => ({
          tableId: `table-${Math.floor(i / 8) + 1}`,
          seatNumber: (i % 8) + 1,
          attendeeId: `attendee-${i + 1}`,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      expect(() => PlanSchema.parse(largePlan)).not.toThrow()
      const result = PlanSchema.parse(largePlan)
      expect(result.tables).toHaveLength(25)
      expect(result.attendees).toHaveLength(200)
      expect(result.seatAssignments).toHaveLength(200)
    })

    it('should validate mixed table shapes and configurations', () => {
      const mixedPlan = {
        id: 'mixed-plan',
        name: 'Mixed Table Shapes',
        tables: [
          {
            id: 'round-table',
            name: 'Round Table',
            shape: 'round' as TableShape,
            position: { x: 0, y: 0 },
            seatCount: 8,
            rotation: 0,
            size: { width: 100, height: 100 },
          },
          {
            id: 'rect-table',
            name: 'Rectangular Table',
            shape: 'rect' as TableShape,
            position: { x: 200, y: 0 },
            seatCount: 12,
            rotation: 45,
            size: { width: 160, height: 80 },
          },
          {
            id: 'square-table',
            name: 'Square Table',
            shape: 'square' as TableShape,
            position: { x: 400, y: 0 },
            seatCount: 4,
            rotation: 90,
            size: { width: 80, height: 80 },
          },
        ],
        attendees: [],
        seatAssignments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      expect(() => PlanSchema.parse(mixedPlan)).not.toThrow()
    })
  })
})

// Helper function to create a valid table for testing
function createValidTable(): Table {
  return {
    id: 'test-table',
    name: 'Test Table',
    shape: 'round',
    position: { x: 0, y: 0 },
    seatCount: 8,
    rotation: 0,
    size: { width: 100, height: 100 },
  }
}