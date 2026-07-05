import type { OTOperation } from '@collabcode/shared';

export function applyOperation(content: string, op: OTOperation): string {
  switch (op.type) {
    case 'insert': {
      const pos = Math.min(op.position, content.length);
      return content.slice(0, pos) + (op.content ?? '') + content.slice(pos);
    }
    case 'delete': {
      const pos = Math.min(op.position, content.length);
      const len = op.length ?? 0;
      return content.slice(0, pos) + content.slice(pos + len);
    }
    case 'retain':
      return content;
    default:
      return content;
  }
}

export function transformOperation(op1: OTOperation, op2: OTOperation): OTOperation {
  if (op1.fileId !== op2.fileId) return op1;

  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op2.position <= op1.position) {
      return { ...op1, position: op1.position + (op2.content?.length ?? 0) };
    }
    return op1;
  }

  if (op1.type === 'insert' && op2.type === 'delete') {
    if (op2.position < op1.position) {
      const deleted = op2.length ?? 0;
      return { ...op1, position: Math.max(op2.position, op1.position - deleted) };
    }
    return op1;
  }

  if (op1.type === 'delete' && op2.type === 'insert') {
    if (op2.position <= op1.position) {
      return { ...op1, position: op1.position + (op2.content?.length ?? 0) };
    }
    return op1;
  }

  if (op1.type === 'delete' && op2.type === 'delete') {
    if (op2.position < op1.position) {
      const deleted = op2.length ?? 0;
      return { ...op1, position: Math.max(op2.position, op1.position - deleted) };
    }
    return op1;
  }

  return op1;
}
