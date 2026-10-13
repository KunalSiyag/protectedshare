import { z } from "zod";
import { MAX_DROP_TOTAL_BYTES, MAX_DROP_CHUNKS, MAX_REQUEST_RESPONSE_BYTES, MAX_CHAT_BLOB_CHARS, MIN_CHAT_TTL_SECONDS, MAX_CHAT_TTL_SECONDS, MAX_MANAGE_BATCH_ITEMS, MAX_REPORT_DETAILS_CHARS } from "./constants";

// Plain values (no zod) live in ./constants so browser code can import them without pulling zod.
export * from "./constants";

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
  createdAt: z.number().int().nonnegative(),
  /** Added in API v2; legacy rows report 1 / null. */
  v: z.literal(1).optional(),
  kdf: z.null().optional()
});

export const CreateSecretRequestSchema = z.object({
  payload: NotePayloadSchema,
  passwordProof: Base64UrlSchema,
  expiresAt: z.number().int().positive(),
  isBurnAfterRead: z.literal(true).default(true),
  maxReads: z.number().int().min(1).max(100).default(1)
});

export const CreateSecretResponseSchema = z.object({
  id: z.string().min(1)
});

export const GetSecretResponseSchema = z.object({
  id: z.string().min(1),
  payload: NotePayloadSchema,
  expiresAt: z.number().int().positive(),
  createdAt: z.number().int().nonnegative(),
  remainingReads: z.number().int().nonnegative().optional(),
  /** Added in API v2; legacy rows report 1 / null. */
  v: z.literal(1).optional(),
  kdf: z.null().optional()
});

export const CreateChatMessageRequestSchema = z.object({
  payload: NotePayloadSchema,
});

export const ChatMessageResponseSchema = z.object({
  id: z.string().min(1),
  payload: NotePayloadSchema,
  createdAt: z.number().int().nonnegative()
});

export const GetChatMessagesResponseSchema = z.object({
  messages: z.array(ChatMessageResponseSchema)
});

export const UpdateChatPresenceRequestSchema = z.object({
  clientId: z.string().min(1),
  isTyping: z.boolean().default(false),
  state: z.enum(["active", "leave"]).default("active")
});

export const GetChatPresenceResponseSchema = z.object({
  onlineCount: z.number().int().nonnegative(),
  typingCount: z.number().int().nonnegative(),
  generatedAt: z.number().int().nonnegative()
});

export const ApiErrorSchema = z.object({
  error: z.string().min(1),
  code: z.string().min(1)
});

export type NotePayload = z.infer<typeof NotePayloadSchema>;
export type CreateChatMessageRequest = z.infer<typeof CreateChatMessageRequestSchema>;
export type ChatMessageResponse = z.infer<typeof ChatMessageResponseSchema>;
export type GetChatMessagesResponse = z.infer<typeof GetChatMessagesResponseSchema>;
export type UpdateChatPresenceRequest = z.infer<typeof UpdateChatPresenceRequestSchema>;
export type GetChatPresenceResponse = z.infer<typeof GetChatPresenceResponseSchema>;
export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;
export type CreateNoteResponse = z.infer<typeof CreateNoteResponseSchema>;
export type GetNoteResponse = z.infer<typeof GetNoteResponseSchema>;
export type CreateSecretRequest = z.infer<typeof CreateSecretRequestSchema>;
export type CreateSecretResponse = z.infer<typeof CreateSecretResponseSchema>;
export type GetSecretResponse = z.infer<typeof GetSecretResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

/* ------------------------------------------------------------------------ */
/* API v2                                                                    */
/*                                                                           */
/* Conventions:                                                              */
/* - Every binary value is base64url without padding.                       */
/* - "*Hash" fields are SHA-256(utf8 token) as base64url (43 chars). The     */
/*   server stores the hash and compares SHA-256(presented token) to it.    */
/* - Tokens travel in headers: X-Auth-Token, X-Manage-Token, X-Upload-Token, */
/*   X-Delete-Token (and `?token=` only for EventSource/presence).          */
/* - Share/drop/request/receipt timestamps are epoch SECONDS. Chat           */
/*   timestamps (createdAt, expiresAt, deletedAt) are epoch MILLISECONDS.   */
/* ------------------------------------------------------------------------ */

/** SHA-256 digest as unpadded base64url (always 43 chars). */
export const TokenHashSchema = z
  .string()
  .length(43)
  .regex(/^[A-Za-z0-9_-]+$/, "Expected a base64url SHA-256 hash");

export const KdfModeSchema = z.enum(["key", "password", "key+password"]);

/** Matches `SealedV2` from @protectedshare/crypto. */
export const SealedPayloadV2Schema = z.object({
  v: z.literal(2),
  kdf: KdfModeSchema,
  encryptedBlob: Base64UrlSchema,
  iv: Base64UrlSchema,
  salt: Base64UrlSchema
});

export const EncryptedJsonSchema = z.object({
  encryptedBlob: Base64UrlSchema,
  iv: Base64UrlSchema
});

/* ---- Notes / secrets v2 ---- */

export const CreateNoteV2RequestSchema = z.object({
  payload: SealedPayloadV2Schema,
  authHash: TokenHashSchema,
  manageTokenHash: TokenHashSchema.optional(),
  expiresAt: z.number().int().positive(),
  isBurnAfterRead: z.boolean().default(false)
});

export const CreateSecretV2RequestSchema = z.object({
  payload: SealedPayloadV2Schema,
  authHash: TokenHashSchema,
  manageTokenHash: TokenHashSchema.optional(),
  expiresAt: z.number().int().positive(),
  maxReads: z.number().int().min(1).max(100).default(1)
});

/** GET /api/notes/:id/meta and /api/secrets/:id/meta. No ciphertext. */
export const ShareMetaResponseSchema = z.object({
  id: z.string().min(1),
  v: z.union([z.literal(1), z.literal(2)]),
  kdf: KdfModeSchema.nullable(),
  salt: z.string(),
  expiresAt: z.number().int(),
  isBurnAfterRead: z.boolean(),
  /** Secrets only. */
  remainingReads: z.number().int().nonnegative().optional()
});

export const GetNoteV2ResponseSchema = z.object({
  id: z.string().min(1),
  v: z.literal(2),
  kdf: KdfModeSchema,
  payload: SealedPayloadV2Schema,
  expiresAt: z.number().int().positive(),
  isBurnAfterRead: z.boolean(),
  createdAt: z.number().int().nonnegative()
});

export const GetSecretV2ResponseSchema = z.object({
  id: z.string().min(1),
  v: z.literal(2),
  kdf: KdfModeSchema,
  payload: SealedPayloadV2Schema,
  expiresAt: z.number().int().positive(),
  createdAt: z.number().int().nonnegative(),
  remainingReads: z.number().int().nonnegative()
});

/* ---- Manage / receipts ---- */

export const ShareKindSchema = z.enum(["note", "secret", "drop", "request"]);
export const ReceiptStatusSchema = z.enum(["active", "consumed", "expired", "revoked"]);

export const ManageStatusResponseSchema = z.object({
  kind: ShareKindSchema,
  id: z.string().min(1),
  status: ReceiptStatusSchema,
  /** Successful reads / started downloads / responses (requests: 1 once answered). */
  reads: z.number().int().nonnegative(),
  maxReads: z.number().int().positive().nullable(),
  readsRemaining: z.number().int().nonnegative().nullable(),
  createdAt: z.number().int(),
  expiresAt: z.number().int(),
  firstReadAt: z.number().int().nullable(),
  lastReadAt: z.number().int().nullable()
});

export const ManageBatchRequestSchema = z.object({
  items: z
    .array(
      z.object({
        kind: ShareKindSchema,
        id: z.string().min(1).max(64),
        token: z.string().min(1).max(256)
      })
    )
    .max(MAX_MANAGE_BATCH_ITEMS)
});

export const ManageBatchNotFoundSchema = z.object({
  kind: ShareKindSchema,
  id: z.string(),
  /** No receipt, receipt purged (30 days after expiry), or wrong token. */
  status: z.literal("not_found")
});

export const ManageBatchItemSchema = z.union([ManageStatusResponseSchema, ManageBatchNotFoundSchema]);

export const ManageBatchResponseSchema = z.object({
  /** Same order as the request items. */
  items: z.array(ManageBatchItemSchema)
});

/* ---- File drops ---- */

export const CreateDropRequestSchema = z.object({
  /** Encrypted JSON manifest (file names, sizes, types, chunk map). Max 200,000 chars. */
  manifest: z.object({
    encryptedBlob: Base64UrlSchema.max(200_000),
    iv: Base64UrlSchema
  }),
  salt: Base64UrlSchema,
  authHash: TokenHashSchema,
  manageTokenHash: TokenHashSchema.optional(),
  /** Sum of encrypted chunk byte lengths (each chunk = IV + ciphertext + tag). */
  totalBytes: z.number().int().positive().max(MAX_DROP_TOTAL_BYTES),
  chunkCount: z.number().int().min(1).max(MAX_DROP_CHUNKS),
  maxDownloads: z.number().int().min(1).max(100).default(1),
  expiresAt: z.number().int().positive()
});

export const CreateDropResponseSchema = z.object({
  id: z.string().min(1),
  /** Send as X-Upload-Token on chunk PUTs and /complete. Not stored in plaintext. */
  uploadToken: z.string().min(1)
});

export const UploadDropChunkResponseSchema = z.object({
  idx: z.number().int().nonnegative(),
  size: z.number().int().nonnegative()
});

export const CompleteDropResponseSchema = z.object({
  id: z.string().min(1),
  totalBytes: z.number().int().nonnegative(),
  chunkCount: z.number().int().positive()
});

export const DropMetaResponseSchema = z.object({
  id: z.string().min(1),
  salt: z.string(),
  chunkCount: z.number().int().positive(),
  /** Actual stored ciphertext bytes. */
  totalBytes: z.number().int().nonnegative(),
  expiresAt: z.number().int(),
  downloadsRemaining: z.number().int().nonnegative()
});

export const DropManifestResponseSchema = z.object({
  manifest: EncryptedJsonSchema,
  chunkCount: z.number().int().positive()
});

/** POST /api/drops/:id/start (X-Auth-Token). Spends one download and opens a download session. */
export const StartDropDownloadResponseSchema = z.object({
  /** Send as X-Download-Token on chunk GETs and on /consume (finish). */
  downloadToken: z.string().min(1),
  /** Downloads left after this one. */
  downloadsRemaining: z.number().int().nonnegative(),
  /** Epoch seconds when the download session (and its token) stops working. */
  expiresAt: z.number().int()
});

/** POST /api/drops/:id/consume (X-Download-Token): finishes the download session. */
export const ConsumeDropResponseSchema = z.object({
  downloadsRemaining: z.number().int().nonnegative(),
  /** True when no downloads are left, no other download is running, and the drop is gone. */
  deleted: z.boolean()
});

/* ---- Secret requests ---- */

export const CreateRequestRequestSchema = z.object({
  /** Raw uncompressed P-256 public key (65 bytes) as base64url. */
  publicKey: Base64UrlSchema.max(200),
  /**
   * Label encrypted with the key in the sender link fragment (#k=): JSON
   * { title?, note?, pk } where pk = SHA-256(raw public key) base64url, so the sender can
   * check the public key wasn't swapped. Current clients always send it.
   */
  label: z
    .object({
      encryptedBlob: Base64UrlSchema.max(4_000),
      iv: Base64UrlSchema
    })
    .optional(),
  inboxHash: TokenHashSchema,
  /** SHA-256 of the respond token derived from the link key (crypto `deriveRespondToken`). */
  respondHash: TokenHashSchema.optional(),
  manageTokenHash: TokenHashSchema.optional(),
  expiresAt: z.number().int().positive()
});

export const CreateRequestResponseSchema = z.object({
  id: z.string().min(1)
});

export const PublicRequestResponseSchema = z.object({
  id: z.string().min(1),
  publicKey: z.string().min(1),
  label: EncryptedJsonSchema.nullable(),
  hasResponse: z.boolean(),
  expiresAt: z.number().int(),
  createdAt: z.number().int()
});

/** Body of POST /api/requests/:id/respond. Matches crypto `sealToPublicKey` output. */
export const RespondToRequestRequestSchema = z.object({
  ephemeralPublicKey: Base64UrlSchema.max(200),
  salt: Base64UrlSchema.max(200),
  iv: Base64UrlSchema.max(200),
  encryptedBlob: Base64UrlSchema.max(MAX_REQUEST_RESPONSE_BYTES)
});

export const RespondToRequestResponseSchema = z.object({
  id: z.string().min(1),
  respondedAt: z.number().int()
});

/** GET /api/requests/:id/response (burns the request on success). */
export const RequestResponseSealedSchema = z.object({
  id: z.string().min(1),
  ephemeralPublicKey: z.string().min(1),
  salt: z.string().min(1),
  iv: z.string().min(1),
  encryptedBlob: z.string().min(1),
  respondedAt: z.number().int()
});

/* ---- Chat v2 ---- */

const ChatTtlSchema = z.number().int().min(MIN_CHAT_TTL_SECONDS).max(MAX_CHAT_TTL_SECONDS);

export const ChatClaimRequestSchema = z.object({
  authHash: TokenHashSchema,
  ttlSeconds: ChatTtlSchema.nullable().optional()
});

export const ChatRoomSettingsSchema = z.object({
  roomId: z.string().min(1),
  /** False for legacy password rooms that never claimed (no auth enforced). */
  claimed: z.boolean(),
  /** Default disappearing-message timer clients should apply. Server only enforces per-message ttlSeconds. */
  ttlSeconds: z.number().int().nullable()
});

/** POST /api/chat/:roomId/claim → 201 (created) or 200 (already claimed with the same hash). */
export const ChatClaimResponseSchema = ChatRoomSettingsSchema.extend({
  created: z.boolean()
});

export const UpdateChatSettingsRequestSchema = z.object({
  ttlSeconds: ChatTtlSchema.nullable()
});

export const ChatMessagePayloadV2Schema = z.object({
  encryptedBlob: Base64UrlSchema.max(MAX_CHAT_BLOB_CHARS),
  iv: Base64UrlSchema,
  /** Required by legacy (v1) clients; optional for v2 messages. */
  salt: Base64UrlSchema.optional(),
  v: z.union([z.literal(1), z.literal(2)]).optional()
});

/** POST /api/chat/:roomId. A v1 body ({ payload: {encryptedBlob, iv, salt} }) also parses. */
export const CreateChatMessageV2RequestSchema = z.object({
  payload: ChatMessagePayloadV2Schema,
  ttlSeconds: ChatTtlSchema.nullable().optional(),
  /** SHA-256 of a per-message delete token the sender keeps; enables DELETE of this message. */
  deleteHash: TokenHashSchema.optional()
});

export const ChatMessageV2ResponseSchema = z.object({
  id: z.string().min(1),
  payload: z.object({
    encryptedBlob: z.string(),
    iv: z.string(),
    /** Omitted when the message was sent without a salt. */
    salt: z.string().optional(),
    v: z.union([z.literal(1), z.literal(2)])
  }),
  /** Epoch ms. */
  createdAt: z.number().int().nonnegative(),
  /** Epoch ms, or null if the message does not disappear. */
  expiresAt: z.number().int().nullable(),
  /** True if the sender registered a delete token. */
  deletable: z.boolean()
});

export const GetChatMessagesV2ResponseSchema = z.object({
  messages: z.array(ChatMessageV2ResponseSchema)
});

export const DeleteChatMessageResponseSchema = z.object({
  id: z.string().min(1),
  deleted: z.literal(true)
});

export const BurnChatRoomResponseSchema = z.object({
  roomId: z.string().min(1),
  burnedAt: z.number().int()
});

/** SSE event payloads on GET /api/chat/:roomId/stream. */
export const ChatStreamReadyEventSchema = z.object({ connected: z.literal(true), roomId: z.string() });
export const ChatStreamMessagesEventSchema = GetChatMessagesV2ResponseSchema;
export const ChatStreamDeletedEventSchema = z.object({ ids: z.array(z.string()) });
export const ChatStreamBurnedEventSchema = z.object({ roomId: z.string(), burnedAt: z.number().int() });

export type KdfMode = z.infer<typeof KdfModeSchema>;
export type SealedPayloadV2 = z.infer<typeof SealedPayloadV2Schema>;
export type EncryptedJson = z.infer<typeof EncryptedJsonSchema>;
export type CreateNoteV2Request = z.infer<typeof CreateNoteV2RequestSchema>;
export type CreateNoteV2RequestInput = z.input<typeof CreateNoteV2RequestSchema>;
export type CreateSecretV2Request = z.infer<typeof CreateSecretV2RequestSchema>;
export type CreateSecretV2RequestInput = z.input<typeof CreateSecretV2RequestSchema>;
export type ShareMetaResponse = z.infer<typeof ShareMetaResponseSchema>;
export type GetNoteV2Response = z.infer<typeof GetNoteV2ResponseSchema>;
export type GetSecretV2Response = z.infer<typeof GetSecretV2ResponseSchema>;
export type ShareKind = z.infer<typeof ShareKindSchema>;
export type ReceiptStatus = z.infer<typeof ReceiptStatusSchema>;
export type ManageStatusResponse = z.infer<typeof ManageStatusResponseSchema>;
export type ManageBatchRequest = z.infer<typeof ManageBatchRequestSchema>;
export type ManageBatchItem = z.infer<typeof ManageBatchItemSchema>;
export type ManageBatchResponse = z.infer<typeof ManageBatchResponseSchema>;
export type CreateDropRequest = z.infer<typeof CreateDropRequestSchema>;
export type CreateDropRequestInput = z.input<typeof CreateDropRequestSchema>;
export type CreateDropResponse = z.infer<typeof CreateDropResponseSchema>;
export type UploadDropChunkResponse = z.infer<typeof UploadDropChunkResponseSchema>;
export type CompleteDropResponse = z.infer<typeof CompleteDropResponseSchema>;
export type DropMetaResponse = z.infer<typeof DropMetaResponseSchema>;
export type DropManifestResponse = z.infer<typeof DropManifestResponseSchema>;
export type ConsumeDropResponse = z.infer<typeof ConsumeDropResponseSchema>;
export type StartDropDownloadResponse = z.infer<typeof StartDropDownloadResponseSchema>;
export type CreateRequestRequest = z.infer<typeof CreateRequestRequestSchema>;
export type CreateRequestResponse = z.infer<typeof CreateRequestResponseSchema>;
export type PublicRequestResponse = z.infer<typeof PublicRequestResponseSchema>;
export type RespondToRequestRequest = z.infer<typeof RespondToRequestRequestSchema>;
export type RespondToRequestResponse = z.infer<typeof RespondToRequestResponseSchema>;
export type RequestResponseSealed = z.infer<typeof RequestResponseSealedSchema>;
export type ChatClaimRequest = z.infer<typeof ChatClaimRequestSchema>;
export type ChatClaimResponse = z.infer<typeof ChatClaimResponseSchema>;
export type ChatRoomSettings = z.infer<typeof ChatRoomSettingsSchema>;
export type UpdateChatSettingsRequest = z.infer<typeof UpdateChatSettingsRequestSchema>;
export type ChatMessagePayloadV2 = z.infer<typeof ChatMessagePayloadV2Schema>;
export type CreateChatMessageV2Request = z.infer<typeof CreateChatMessageV2RequestSchema>;
export type ChatMessageV2Response = z.infer<typeof ChatMessageV2ResponseSchema>;
export type GetChatMessagesV2Response = z.infer<typeof GetChatMessagesV2ResponseSchema>;
export type DeleteChatMessageResponse = z.infer<typeof DeleteChatMessageResponseSchema>;
export type BurnChatRoomResponse = z.infer<typeof BurnChatRoomResponseSchema>;
export type ChatStreamReadyEvent = z.infer<typeof ChatStreamReadyEventSchema>;
export type ChatStreamMessagesEvent = z.infer<typeof ChatStreamMessagesEventSchema>;
export type ChatStreamDeletedEvent = z.infer<typeof ChatStreamDeletedEventSchema>;
export type ChatStreamBurnedEvent = z.infer<typeof ChatStreamBurnedEventSchema>;

/* ------------------------------------------------------------------------ */
/* Rate limits, usage stats, abuse reports, admin takedown                   */
/* ------------------------------------------------------------------------ */

/** What GET /api/stats counts: successful creates (drops when completed, chat rooms when first claimed). */
export const UsageKindSchema = z.enum(["note", "secret", "drop", "request", "chat"]);

/** GET /api/stats. Cached for 10 minutes (Cache-Control: public, max-age=600). */
export const UsageStatsResponseSchema = z.object({
  last30Days: z.object({
    total: z.number().int().nonnegative(),
    byKind: z.object({
      note: z.number().int().nonnegative(),
      secret: z.number().int().nonnegative(),
      drop: z.number().int().nonnegative(),
      request: z.number().int().nonnegative(),
      chat: z.number().int().nonnegative()
    })
  }),
  /** Epoch seconds. */
  generatedAt: z.number().int()
});

export const ReportReasonSchema = z.enum(["malware", "phishing", "illegal", "spam", "other"]);

/** POST /api/reports. Only kind + id identify the share: never the link or its fragment. */
export const CreateReportRequestSchema = z.object({
  kind: ShareKindSchema,
  id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/, "Expected a share id"),
  reason: ReportReasonSchema,
  details: z.string().max(MAX_REPORT_DETAILS_CHARS).optional(),
  /** Optional email for follow-up questions. */
  contact: z.string().max(320).email().optional()
});

export const CreateReportResponseSchema = z.object({
  id: z.string().min(1),
  received: z.literal(true)
});

/** DELETE /api/admin/:kind/:id: content deleted (with any R2 objects), receipt marked revoked. */
export const AdminTakedownResponseSchema = z.object({
  kind: ShareKindSchema,
  id: z.string().min(1),
  /** False when the content was already gone. */
  deleted: z.boolean(),
  /** True when an active receipt was marked revoked, so the sender's "My links" shows it. */
  receiptRevoked: z.boolean()
});

export type UsageKind = z.infer<typeof UsageKindSchema>;
export type UsageStatsResponse = z.infer<typeof UsageStatsResponseSchema>;
export type ReportReason = z.infer<typeof ReportReasonSchema>;
export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;
export type CreateReportResponse = z.infer<typeof CreateReportResponseSchema>;
export type AdminTakedownResponse = z.infer<typeof AdminTakedownResponseSchema>;

/* ---- Read notifications (Web Push) ---- */
/* POST/DELETE /api/manage/:kind/:id/watch with X-Manage-Token. The server keeps the browser's push */
/* subscription until the share is used up, revoked or expires, and sends a Web Push (RFC 8291) on */
/* the first open and when the share is used up. */

const PushKeySchema = z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+={0,2}$/, "Expected base64url");

/** PushSubscription.toJSON() minus expirationTime. The endpoint must be a known browser push service. */
export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    /** Uncompressed P-256 public key (65 bytes). */
    p256dh: PushKeySchema,
    /** 16-byte auth secret. */
    auth: PushKeySchema
  })
});

export const WatchShareRequestSchema = z.object({
  subscription: PushSubscriptionSchema
});

/** DELETE body (optional). Without an endpoint, every browser watching the share is removed. */
export const UnwatchShareRequestSchema = z.object({
  endpoint: z.string().max(2048).optional()
});

export const WatchShareResponseSchema = z.object({
  kind: ShareKindSchema,
  id: z.string().min(1),
  watching: z.boolean()
});

/** opened: first read / download / answer. used_up: the read that burned it or spent the last read or download. */
export const PushEventNameSchema = z.enum(["opened", "used_up"]);

/** The decrypted push message the service worker receives. `at` is epoch seconds. */
export const PushEventPayloadSchema = z.object({
  kind: ShareKindSchema,
  id: z.string().min(1).max(64),
  event: PushEventNameSchema,
  at: z.number().int()
});

export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;
export type WatchShareRequest = z.infer<typeof WatchShareRequestSchema>;
export type UnwatchShareRequest = z.infer<typeof UnwatchShareRequestSchema>;
export type WatchShareResponse = z.infer<typeof WatchShareResponseSchema>;
export type PushEventName = z.infer<typeof PushEventNameSchema>;
export type PushEventPayload = z.infer<typeof PushEventPayloadSchema>;
