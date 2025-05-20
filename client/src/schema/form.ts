// Define a shared schema for the employee type that includes cashPaid
import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().nonempty("Employee name is required"),
  hours: z.coerce.number().min(0, "Cannot be negative"),
  cashPaid: z.coerce.number().min(0, "Cannot be negative").optional(),
});

export type Employee = z.infer<typeof employeeSchema>;