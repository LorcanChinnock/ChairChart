import { z } from "zod";

export type Vec2 = { x: number; y: number };

export const Vec2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

export const TableShapeSchema = z.enum(["round", "rect", "square"]);
export type TableShape = z.infer<typeof TableShapeSchema>;

export const AttendeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});
export type Attendee = z.infer<typeof AttendeeSchema>;

export const SeatConfigSchema = z.object({
  cornerSeats: z.number().min(0).max(4).optional(),
}).optional();

export type SeatConfig = z.infer<typeof SeatConfigSchema>;

export const TableSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shape: TableShapeSchema,
  position: Vec2Schema,
  seatCount: z.number().min(1).max(20),
  rotation: z.number().default(0),
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  seatConfig: SeatConfigSchema,
});
export type Table = z.infer<typeof TableSchema>;

export const SeatAssignmentSchema = z.object({
  tableId: z.string(),
  seatNumber: z.number().min(1).max(20),
  attendeeId: z.string().nullable(),
});
export type SeatAssignment = z.infer<typeof SeatAssignmentSchema>;

export const PlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  tables: z.array(TableSchema),
  attendees: z.array(AttendeeSchema),
  seatAssignments: z.array(SeatAssignmentSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Plan = z.infer<typeof PlanSchema>;

export interface SeatPosition {
  position: Vec2;
  angle: number;
  seatNumber: number;
}