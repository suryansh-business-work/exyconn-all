import type { z } from 'zod';
import type { attendanceSchema } from './attendance.schema';

export type AttendanceValues = z.infer<typeof attendanceSchema>;
