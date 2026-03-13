import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '~/lib/db';
import { transactions, transactionParticipants, user as userTable } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '~/lib/activity';
import { createNotification } from '~/lib/notifications';

const AddParticipantSchema = z.object({
  email: z.string().email('Adresse courriel invalide'),
  role: z.enum(['buyer', 'seller', 'notary', 'inspector', 'broker', 'tenant', 'landlord']),
});

const RemoveParticipantSchema = z.object({
  participantId: z.string().min(1),
});

// POST /api/transactions/[id]/participants — add a participant by email
export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user as (typeof locals.user & { role?: string }) | null;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 });
  }

  const { id } = params;

  // Verify broker owns this transaction
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      user.role === 'admin'
        ? eq(transactions.id, id!)
        : and(eq(transactions.id, id!), eq(transactions.brokerId, user.id))
    );

  if (!tx) {
    return new Response(JSON.stringify({ error: 'Transaction introuvable ou accès refusé' }), { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), { status: 400 });
  }

  const parsed = AddParticipantSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return new Response(JSON.stringify({ error: firstError?.message ?? 'Données invalides' }), { status: 422 });
  }

  const { email, role } = parsed.data;

  // Look up user by email
  const [targetUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email.toLowerCase()));

  if (!targetUser) {
    return new Response(
      JSON.stringify({
        error: `Aucun compte trouvé pour l'adresse courriel ${email}. Invitez cet utilisateur à créer un compte sur ImmoTrack.`,
        code: 'USER_NOT_FOUND',
      }),
      { status: 404 }
    );
  }

  // Check if already a participant
  const [existing] = await db
    .select()
    .from(transactionParticipants)
    .where(
      and(
        eq(transactionParticipants.transactionId, id!),
        eq(transactionParticipants.userId, targetUser.id)
      )
    );

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Cet utilisateur est déjà participant à cette transaction.' }),
      { status: 409 }
    );
  }

  // Add participant
  const [participant] = await db
    .insert(transactionParticipants)
    .values({
      transactionId: id!,
      userId: targetUser.id,
      role,
    })
    .returning();

  // Send notification to the added user
  await createNotification({
    userId: targetUser.id,
    type: 'invitation',
    title: 'Vous avez été ajouté à une transaction',
    message: `Vous avez été ajouté en tant que "${role}" à la transaction "${tx.title}".`,
    transactionId: id!,
  });

  // Log activity
  await logActivity(id!, user.id, `Participant ajouté : ${targetUser.name} (${role})`, {
    participantEmail: email,
    role,
  });

  return new Response(
    JSON.stringify({ participant, user: { id: targetUser.id, name: targetUser.name, email: targetUser.email } }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};

// DELETE /api/transactions/[id]/participants — remove a participant (broker only)
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user as (typeof locals.user & { role?: string }) | null;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 });
  }

  const { id } = params;

  // Verify broker owns this transaction
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      user.role === 'admin'
        ? eq(transactions.id, id!)
        : and(eq(transactions.id, id!), eq(transactions.brokerId, user.id))
    );

  if (!tx) {
    return new Response(JSON.stringify({ error: 'Transaction introuvable ou accès refusé' }), { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), { status: 400 });
  }

  const parsed = RemoveParticipantSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'ID de participant requis' }), { status: 422 });
  }

  const { participantId } = parsed.data;

  // Find the participant
  const [participant] = await db
    .select()
    .from(transactionParticipants)
    .where(
      and(
        eq(transactionParticipants.id, participantId),
        eq(transactionParticipants.transactionId, id!)
      )
    );

  if (!participant) {
    return new Response(JSON.stringify({ error: 'Participant introuvable' }), { status: 404 });
  }

  await db
    .delete(transactionParticipants)
    .where(eq(transactionParticipants.id, participantId));

  await logActivity(id!, user.id, 'Participant retiré', { participantId });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
