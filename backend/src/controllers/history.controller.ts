import type { Request, Response } from 'express';
import { z } from 'zod';
import { Version } from '../models/Version';
import { Room } from '../models/Room';

const saveVersionSchema = z.object({
  roomId: z.string(),
  fileId: z.string(),
  content: z.string(),
  savedBy: z.string(),
  label: z.string().optional(),
});

export async function handleGetHistory(req: Request, res: Response): Promise<void> {
  const { room } = req.params;
  const versions = await Version.find({ roomId: room })
    .sort({ savedAt: -1 })
    .limit(50);
  res.json({ success: true, data: versions });
}

export async function handleSaveVersion(req: Request, res: Response): Promise<void> {
  const parsed = saveVersionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
    return;
  }
  const version = await Version.create(parsed.data);
  res.status(201).json({ success: true, data: version });
}

export async function handleRestoreVersion(req: Request, res: Response): Promise<void> {
  const { versionId } = req.params;
  const version = await Version.findById(versionId);
  if (!version) {
    res.status(404).json({ success: false, error: 'Version not found' });
    return;
  }
  await Room.updateOne(
    { _id: version.roomId, 'files.id': version.fileId },
    { $set: { 'files.$.content': version.content, 'files.$.updatedAt': new Date() } }
  );
  res.json({ success: true, data: version });
}
