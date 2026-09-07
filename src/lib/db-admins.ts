import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { AdminRole, AdminStatus, AdminUser, AdminUserPublic } from '@/types/admin';

const DB_NAME = process.env.MONGODB_DB || 'icebreaker_db';

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPasswordHash(password: string, salt: string, storedHash: string): boolean {
  try {
    const hash = hashPassword(password, salt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function toPublicAdmin(user: AdminUser): AdminUserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

let indexesEnsured = false;
async function ensureAdminIndexes() {
  if (indexesEnsured) return;
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    await db.collection('admins').createIndex({ email: 1 }, { unique: true });
    indexesEnsured = true;
  } catch {
    // ignore index creation errors if already exists
  }
}

let seedPromise: Promise<AdminUser | null> | null = null;

export async function seedMasterAdminIfNeeded(): Promise<AdminUser | null> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    await ensureAdminIndexes();
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<AdminUser>('admins');

    const existingMaster = await collection.findOne({ role: 'master_admin' });
    if (existingMaster) {
      return existingMaster;
    }

    // Count if any admins exist
    const count = await collection.countDocuments({});
    if (count > 0) {
      // If there are existing admins but no master_admin, promote the first active one
      const firstAdmin = await collection.findOne({ status: 'active' });
      if (firstAdmin) {
        await collection.updateOne(
          { id: firstAdmin.id },
          { $set: { role: 'master_admin', updatedAt: new Date().toISOString() } }
        );
        return { ...firstAdmin, role: 'master_admin' };
      }
    }

    // Seed default Master Admin from env or defaults
    const masterEmail = (process.env.MASTER_ADMIN_EMAIL || 'admin@icebreaker.local').toLowerCase().trim();
    const masterPassword = process.env.MASTER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';
    const salt = generateSalt();
    const passwordHash = hashPassword(masterPassword, salt);

    const now = new Date().toISOString();
    const masterUser: AdminUser = {
      id: crypto.randomUUID(),
      email: masterEmail,
      name: 'Master Admin',
      passwordHash,
      salt,
      role: 'master_admin',
      status: 'active',
      mustChangePassword: false,
      tokenVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    await collection.updateOne(
      { email: masterEmail },
      { $set: masterUser },
      { upsert: true }
    );

    return masterUser;
  })();

  return seedPromise;
}

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection<AdminUser>('admins').findOne({ email: email.toLowerCase().trim() });
}

export async function findAdminById(id: string): Promise<AdminUser | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection<AdminUser>('admins').findOne({ id });
}

export async function getAllAdmins(): Promise<AdminUserPublic[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const docs = await db
    .collection<AdminUser>('admins')
    .find({})
    .sort({ role: 1, createdAt: -1 })
    .toArray();

  return docs.map(toPublicAdmin);
}

export async function createAdminUser(data: {
  email: string;
  name: string;
  password: string;
  role?: AdminRole;
  mustChangePassword?: boolean;
}): Promise<AdminUserPublic> {
  await ensureAdminIndexes();
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AdminUser>('admins');

  const cleanEmail = data.email.toLowerCase().trim();
  const existing = await collection.findOne({ email: cleanEmail });
  if (existing) {
    throw new Error('An admin with this email address already exists');
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(data.password, salt);
  const now = new Date().toISOString();

  const newAdmin: AdminUser = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    name: data.name.trim(),
    passwordHash,
    salt,
    role: data.role || 'admin',
    status: 'active',
    mustChangePassword: data.mustChangePassword ?? true,
    tokenVersion: 1,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(newAdmin);
  return toPublicAdmin(newAdmin);
}

export async function updateAdminUser(
  id: string,
  updates: {
    name?: string;
    role?: AdminRole;
    status?: AdminStatus;
  }
): Promise<AdminUserPublic | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AdminUser>('admins');

  const updateFields: Partial<AdminUser> = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.name) updateFields.name = updates.name.trim();
  if (updates.role) updateFields.role = updates.role;
  if (updates.status) {
    updateFields.status = updates.status;
    // When status changes to suspended, increment tokenVersion to revoke active sessions instantly
    if (updates.status === 'suspended') {
      await collection.updateOne({ id }, { $inc: { tokenVersion: 1 } });
    }
  }

  const updated = await collection.findOneAndUpdate(
    { id },
    { $set: updateFields },
    { returnDocument: 'after' }
  );

  return updated ? toPublicAdmin(updated) : null;
}

export async function revokeAdminSessions(id: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection<AdminUser>('admins').updateOne(
    { id },
    {
      $inc: { tokenVersion: 1 },
      $set: { updatedAt: new Date().toISOString() },
    }
  );
}

export async function changeAdminPassword(
  id: string,
  newPassword: string,
  clearMustChangeFlag = true
): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const salt = generateSalt();
  const passwordHash = hashPassword(newPassword, salt);

  const res = await db.collection<AdminUser>('admins').updateOne(
    { id },
    {
      $set: {
        passwordHash,
        salt,
        mustChangePassword: clearMustChangeFlag ? false : undefined,
        updatedAt: new Date().toISOString(),
      },
      $inc: { tokenVersion: 1 },
    }
  );

  return res.modifiedCount > 0;
}

export async function recordAdminLogin(id: string): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    await db.collection<AdminUser>('admins').updateOne(
      { id },
      { $set: { lastLoginAt: new Date().toISOString() } }
    );
  } catch (error) {
    console.error('Failed to record admin login timestamp:', error);
  }
}

export async function deleteAdminUser(id: string): Promise<{ success: boolean; error?: string }> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AdminUser>('admins');

  const target = await collection.findOne({ id });
  if (!target) {
    return { success: false, error: 'Admin user not found' };
  }

  if (target.role === 'master_admin') {
    return { success: false, error: 'Cannot delete a Master Admin account' };
  }

  const res = await collection.deleteOne({ id });
  return { success: res.deletedCount > 0 };
}
