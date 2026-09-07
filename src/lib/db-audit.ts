import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { AuditAction, AuditLogEntry } from '@/types/admin';

const DB_NAME = process.env.MONGODB_DB || 'icebreaker_db';

export interface RecordAuditOptions {
  action: AuditAction;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  targetId?: number | string | number[];
  targetText?: string;
}

export async function recordAuditLog(options: RecordAuditOptions): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<AuditLogEntry>('audit_logs');

    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      action: options.action,
      actorId: options.actor.id,
      actorName: options.actor.name,
      actorEmail: options.actor.email,
      targetId: options.targetId,
      targetText: options.targetText?.trim() ? options.targetText.trim().slice(0, 300) : undefined,
      timestamp: new Date().toISOString(),
    };

    await collection.insertOne(entry);
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}

export interface GetAuditLogsOptions {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
}

export interface PaginatedAuditLogsResult {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export async function getAuditLogs(
  options: GetAuditLogsOptions = {}
): Promise<PaginatedAuditLogsResult> {
  const { page = 1, limit = 20, search = '', action } = options;

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AuditLogEntry>('audit_logs');

  const query: Record<string, unknown> = {};

  if (action && action !== 'all') {
    query.action = action;
  }

  if (search.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [
      { actorName: regex },
      { actorEmail: regex },
      { targetText: regex },
    ];
  }

  const total = await collection.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const skip = (safePage - 1) * limit;

  const logs = await collection
    .find(query, { projection: { _id: 0 } })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    logs,
    total,
    page: safePage,
    totalPages,
    limit,
  };
}
