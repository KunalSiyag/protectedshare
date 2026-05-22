import { z } from "zod";

export const HealthCheckSchema = z.object({
  status: z.literal("ok")
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

const Base64UrlSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9_-]+$/, "Expected base64url-encoded value");

export const NotePayloadSchema = z.object({
  encryptedBlob: Base64UrlSchema,
  iv: Base64UrlSchema,
  salt: Base64UrlSchema
});

export const CreateNoteRequestSchema = z.object({
  payload: NotePayloadSchema,
  passwordProof: Base64UrlSchema,
  expiresAt: z.number().int().positive(),
  isBurnAfterRead: z.boolean().default(false)
});

export const CreateNoteResponseSchema = z.object({
  id: z.string().min(1)
});

export const GetNoteResponseSchema = z.object({
  id: z.string().min(1),
  payload: NotePayloadSchema,
  expiresAt: z.number().int().positive(),
  isBurnAfterRead: z.boolean(),
  createdAt: z.number().int().nonnegative()
});

export const CreateSecretRequestSchema = z.object({
  payload: NotePayloadSchema,
  passwordProof: Base64UrlSchema,
  expiresAt: z.number().int().positive(),
  isBurnAfterRead: z.literal(true).default(true)
});

export const CreateSecretResponseSchema = z.object({
  id: z.string().min(1)
});

export const GetSecretResponseSchema = z.object({
  id: z.string().min(1),
  payload: NotePayloadSchema,
  expiresAt: z.number().int().positive(),
  createdAt: z.number().int().nonnegative()
});

export const ApiErrorSchema = z.object({
  error: z.string().min(1),
  code: z.string().min(1)
});

export type NotePayload = z.infer<typeof NotePayloadSchema>;
export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;
export type CreateNoteResponse = z.infer<typeof CreateNoteResponseSchema>;
export type GetNoteResponse = z.infer<typeof GetNoteResponseSchema>;
export type CreateSecretRequest = z.infer<typeof CreateSecretRequestSchema>;
export type CreateSecretResponse = z.infer<typeof CreateSecretResponseSchema>;
export type GetSecretResponse = z.infer<typeof GetSecretResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
