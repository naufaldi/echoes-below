import {sqliteTable,text,integer,real,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const saves=sqliteTable('saves',{id:text('id').primaryKey(),owner:text('owner').notNull(),revision:integer('revision').notNull(),body:text('body').notNull(),updatedAt:text('updated_at').notNull()},t=>[index('saves_owner_updated').on(t.owner,t.updatedAt)]);
export const commands=sqliteTable('commands',{owner:text('owner').notNull(),id:text('id').notNull(),saveId:text('save_id').notNull(),hash:text('hash').notNull(),result:text('result').notNull()},t=>[primaryKey({columns:[t.owner,t.id]})]);
export const checkpoints=sqliteTable('checkpoints',{id:text('id').primaryKey(),owner:text('owner').notNull(),saveId:text('save_id').notNull(),body:text('body').notNull()});
export const previews=sqliteTable('previews',{id:text('id').primaryKey(),owner:text('owner').notNull(),body:text('body').notNull()});
export const dialogues=sqliteTable('dialogues',{id:text('id').primaryKey(),owner:text('owner').notNull(),saveId:text('save_id').notNull(),speaker:text('speaker').notNull(),playerText:text('player_text').notNull(),replyText:text('reply_text').notNull(),createdAt:text('created_at').notNull()},t=>[index('dialogues_owner_save_time').on(t.owner,t.saveId,t.createdAt)]);
export const budgets=sqliteTable('budgets',{id:text('id').primaryKey(),reserved:real('reserved').notNull().default(0)});
