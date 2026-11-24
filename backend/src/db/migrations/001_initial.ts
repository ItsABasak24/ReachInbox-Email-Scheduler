import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    await knex.schema.createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('google_id').unique().notNullable();
      table.string('email').notNullable();
      table.string('name').notNullable();
      table.string('avatar_url').nullable();
      table.string('slack_webhook_url').nullable();
      table.string('slack_access_token').nullable();
      table.string('slack_channel_id').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasEmailsTable = await knex.schema.hasTable('emails');
  if (!hasEmailsTable) {
    await knex.schema.createTable('emails', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('sender_email').notNullable();
      table.string('recipient_email').notNullable();
      table.string('subject').notNullable();
      table.text('body').notNullable();
      table.string('status').notNullable().defaultTo('scheduled');
      table.timestamp('scheduled_at').notNullable();
      table.timestamp('sent_at').nullable();
      table.string('bullmq_job_id').nullable();
      table.string('idempotency_key').unique().notNullable();
      table.string('campaign_id').nullable();
      table.text('error_message').nullable();
      table.string('ethereal_url').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['user_id', 'status']);
      table.index(['scheduled_at']);
      table.index(['campaign_id']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('emails');
  await knex.schema.dropTableIfExists('users');
}
