import type { z } from "zod";
import type { jobApplicationSchema } from "./job-application.schema";

/** What the application form holds. The résumé file and the captcha token live beside it. */
export type JobApplicationValues = z.infer<typeof jobApplicationSchema>;

/** The role the form applies for, sent with every application (the portal files by jobId). */
export interface JobApplicationRole {
  jobId: string;
  jobTitle: string;
  companyName: string;
  companySlug: string;
}

/** Where a send ended: idle, sent, or failed (with the reason shown beside the button). */
export type ApplicationStatus = "idle" | "sent" | "failed";
