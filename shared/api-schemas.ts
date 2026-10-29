import {z} from 'zod';
export const commandSchema=z.object({companionPlans:z.record(z.string().max(40),z.string().max(100)).optional(),commandId:z.string().uuid(),expectedRevision:z.number().int().min(0),actionId:z.string().min(1).max(100)}).strict();
export const speakerSchema=z.enum(['dm','mira','oren']);
