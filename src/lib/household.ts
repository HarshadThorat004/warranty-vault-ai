import { randomBytes } from "crypto";
import { addDays } from "date-fns";
import type { Prisma } from "@prisma/client";

import { normalizeEmail } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const MAX_HOUSEHOLD_MEMBERS = 5;
export const INVITE_TTL_DAYS = 7;
export const HOUSEHOLD_OWNER_ROLE = "owner";
export const HOUSEHOLD_MEMBER_ROLE = "member";

export class HouseholdError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "HouseholdError";
    this.status = status;
  }
}

export function vaultProductWhere(
  userId: string,
  householdId: string | null
): Prisma.ProductWhereInput {
  if (householdId) {
    return {
      OR: [{ householdId }, { householdId: null, userId }],
    };
  }

  return { userId, householdId: null };
}

export function canAddHouseholdSeat(
  memberCount: number,
  pendingInviteCount: number,
  max = MAX_HOUSEHOLD_MEMBERS
) {
  return memberCount + pendingInviteCount < max;
}

export function canJoinHousehold(otherMemberCount: number) {
  if (otherMemberCount > 0) {
    return {
      ok: false as const,
      reason: "Leave your current household before joining another.",
    };
  }

  return { ok: true as const };
}

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }

  return out;
}

export function reminderRecipients<T extends { id: string }>(
  owner: T,
  members: T[] | undefined
) {
  if (members && members.length > 0) {
    return uniqueById(members);
  }

  return [owner];
}

export async function getHouseholdIdForUser(userId: string) {
  const membership = await prisma.householdMember.findUnique({
    where: { userId },
    select: { householdId: true },
  });

  return membership?.householdId ?? null;
}

export async function getMembership(userId: string) {
  return prisma.householdMember.findUnique({
    where: { userId },
    include: {
      household: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          invites: {
            where: { expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
}

async function attachPersonalProducts(
  tx: Prisma.TransactionClient,
  userId: string,
  householdId: string
) {
  await tx.product.updateMany({
    where: { userId, householdId: null },
    data: { householdId },
  });
}

export async function getOrCreateOwnedHousehold(userId: string) {
  const existing = await prisma.householdMember.findUnique({
    where: { userId },
    include: { household: true },
  });

  if (existing) {
    if (existing.role !== HOUSEHOLD_OWNER_ROLE) {
      throw new HouseholdError(
        "Only the household owner can invite people",
        403
      );
    }

    return existing.household;
  }

  return prisma.$transaction(async (tx) => {
    const household = await tx.household.create({
      data: {
        name: "Family vault",
        members: {
          create: {
            userId,
            role: HOUSEHOLD_OWNER_ROLE,
          },
        },
      },
    });

    await attachPersonalProducts(tx, userId, household.id);
    return household;
  });
}

export function createInviteToken() {
  return randomBytes(32).toString("base64url");
}

export async function createHouseholdInvite(params: {
  ownerId: string;
  email: string;
}) {
  const email = normalizeEmail(params.email);

  if (!email) {
    throw new HouseholdError("Enter an email address");
  }

  const owner = await prisma.user.findUnique({
    where: { id: params.ownerId },
    select: { id: true, email: true, name: true },
  });

  if (!owner) {
    throw new HouseholdError("Unauthorized", 401);
  }

  if (normalizeEmail(owner.email) === email) {
    throw new HouseholdError("You cannot invite yourself");
  }

  const household = await getOrCreateOwnedHousehold(params.ownerId);

  const [memberCount, pendingInvites, alreadyMember] = await Promise.all([
    prisma.householdMember.count({ where: { householdId: household.id } }),
    prisma.householdInvite.findMany({
      where: { householdId: household.id, expiresAt: { gt: new Date() } },
    }),
    prisma.householdMember.findFirst({
      where: {
        householdId: household.id,
        user: { email },
      },
    }),
  ]);

  if (alreadyMember) {
    throw new HouseholdError("That person is already in this vault");
  }

  const existingInvite = pendingInvites.find(
    (invite) => normalizeEmail(invite.email) === email
  );

  if (
    !existingInvite &&
    !canAddHouseholdSeat(memberCount, pendingInvites.length)
  ) {
    throw new HouseholdError(
      `This vault can have up to ${MAX_HOUSEHOLD_MEMBERS} people, including pending invites`
    );
  }

  const token = createInviteToken();
  const expiresAt = addDays(new Date(), INVITE_TTL_DAYS);

  const invite = existingInvite
    ? await prisma.householdInvite.update({
        where: { id: existingInvite.id },
        data: { token, expiresAt, invitedById: params.ownerId },
      })
    : await prisma.householdInvite.create({
        data: {
          householdId: household.id,
          email,
          token,
          invitedById: params.ownerId,
          expiresAt,
        },
      });

  return { invite, household, owner, resent: Boolean(existingInvite) };
}

export async function getInviteByToken(token: string) {
  const invite = await prisma.householdInvite.findUnique({
    where: { token },
    include: {
      invitedBy: {
        select: { name: true, email: true },
      },
      household: {
        select: { id: true, name: true },
      },
    },
  });

  if (!invite) {
    return null;
  }

  return {
    invite,
    expired: invite.expiresAt.getTime() < Date.now(),
  };
}

export async function acceptHouseholdInvite(params: {
  userId: string;
  email: string;
  token: string;
}) {
  const email = normalizeEmail(params.email);
  const invite = await prisma.householdInvite.findUnique({
    where: { token: params.token },
    include: {
      household: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!invite) {
    throw new HouseholdError("This invite link is invalid", 404);
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.householdInvite
      .delete({ where: { id: invite.id } })
      .catch(() => undefined);
    throw new HouseholdError("This invite has expired");
  }

  if (normalizeEmail(invite.email) !== email) {
    throw new HouseholdError(
      `Sign in as ${invite.email} to accept this invite`,
      403
    );
  }

  const existing = await prisma.householdMember.findUnique({
    where: { userId: params.userId },
    include: {
      household: {
        include: {
          members: true,
        },
      },
    },
  });

  if (existing?.householdId === invite.householdId) {
    await prisma.householdInvite.delete({ where: { id: invite.id } });
    return { alreadyMember: true as const, householdId: invite.householdId };
  }

  const otherMemberCount = existing
    ? existing.household.members.filter((member) => member.userId !== params.userId)
        .length
    : 0;
  const join = canJoinHousehold(otherMemberCount);

  if (!join.ok) {
    throw new HouseholdError(join.reason);
  }

  if (invite.household.members.length >= MAX_HOUSEHOLD_MEMBERS) {
    throw new HouseholdError(
      `This vault is full (${MAX_HOUSEHOLD_MEMBERS} people)`
    );
  }

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.product.updateMany({
        where: { householdId: existing.householdId },
        data: { householdId: invite.householdId },
      });
      await tx.householdInvite.deleteMany({
        where: { householdId: existing.householdId },
      });
      await tx.householdMember.delete({ where: { id: existing.id } });
      await tx.household.delete({ where: { id: existing.householdId } });
    }

    await attachPersonalProducts(tx, params.userId, invite.householdId);

    await tx.householdMember.create({
      data: {
        householdId: invite.householdId,
        userId: params.userId,
        role: HOUSEHOLD_MEMBER_ROLE,
      },
    });

    await tx.householdInvite.delete({ where: { id: invite.id } });
  });

  return { alreadyMember: false as const, householdId: invite.householdId };
}

export async function leaveHousehold(userId: string) {
  const membership = await prisma.householdMember.findUnique({
    where: { userId },
  });

  if (!membership) {
    throw new HouseholdError("You are not in a household");
  }

  if (membership.role === HOUSEHOLD_OWNER_ROLE) {
    const others = await prisma.householdMember.count({
      where: {
        householdId: membership.householdId,
        userId: { not: userId },
      },
    });

    if (others > 0) {
      throw new HouseholdError(
        "The owner cannot leave while others are in the vault. Remove members first, or delete your account to transfer ownership."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { householdId: membership.householdId },
        data: { householdId: null },
      });
      await tx.householdInvite.deleteMany({
        where: { householdId: membership.householdId },
      });
      await tx.household.delete({ where: { id: membership.householdId } });
    });

    return { dissolved: true as const };
  }

  const owner = await prisma.householdMember.findFirst({
    where: {
      householdId: membership.householdId,
      role: HOUSEHOLD_OWNER_ROLE,
    },
  });

  await prisma.$transaction(async (tx) => {
    if (owner) {
      await tx.product.updateMany({
        where: { userId, householdId: membership.householdId },
        data: { userId: owner.userId },
      });
    }

    await tx.householdMember.delete({ where: { id: membership.id } });
  });

  return { dissolved: false as const };
}

export async function removeHouseholdMember(params: {
  ownerId: string;
  memberUserId: string;
}) {
  if (params.ownerId === params.memberUserId) {
    throw new HouseholdError(
      "You cannot remove yourself. Leave the vault instead."
    );
  }

  const owner = await prisma.householdMember.findUnique({
    where: { userId: params.ownerId },
  });

  if (!owner || owner.role !== HOUSEHOLD_OWNER_ROLE) {
    throw new HouseholdError("Only the owner can remove members", 403);
  }

  const member = await prisma.householdMember.findFirst({
    where: {
      userId: params.memberUserId,
      householdId: owner.householdId,
    },
  });

  if (!member) {
    throw new HouseholdError("Member not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { userId: params.memberUserId, householdId: owner.householdId },
      data: { userId: params.ownerId },
    });
    await tx.householdMember.delete({ where: { id: member.id } });
  });
}

export async function revokeInvite(params: {
  ownerId: string;
  inviteId: string;
}) {
  const owner = await prisma.householdMember.findUnique({
    where: { userId: params.ownerId },
  });

  if (!owner || owner.role !== HOUSEHOLD_OWNER_ROLE) {
    throw new HouseholdError("Only the owner can revoke invites", 403);
  }

  const invite = await prisma.householdInvite.findFirst({
    where: { id: params.inviteId, householdId: owner.householdId },
  });

  if (!invite) {
    throw new HouseholdError("Invite not found", 404);
  }

  await prisma.householdInvite.delete({ where: { id: invite.id } });
}

export async function renameHousehold(params: {
  ownerId: string;
  name: string;
}) {
  const name = params.name.trim().slice(0, 60);

  if (!name) {
    throw new HouseholdError("Enter a vault name");
  }

  const owner = await prisma.householdMember.findUnique({
    where: { userId: params.ownerId },
  });

  if (!owner || owner.role !== HOUSEHOLD_OWNER_ROLE) {
    throw new HouseholdError("Only the owner can rename the vault", 403);
  }

  return prisma.household.update({
    where: { id: owner.householdId },
    data: { name },
  });
}

const productFileSelect = {
  invoiceImage: true,
  documents: {
    select: { fileUrl: true },
  },
} as const;

export async function collectAccountDeletionFiles(userId: string) {
  const membership = await prisma.householdMember.findUnique({
    where: { userId },
    include: {
      household: {
        include: {
          members: { orderBy: { createdAt: "asc" } },
          products: { select: productFileSelect },
        },
      },
    },
  });

  const personalProducts = await prisma.product.findMany({
    where: { userId, householdId: null },
    select: productFileSelect,
  });

  if (!membership) {
    const owned = await prisma.product.findMany({
      where: { userId },
      select: productFileSelect,
    });

    return { mode: "solo" as const, products: owned };
  }

  const others = membership.household.members.filter(
    (member) => member.userId !== userId
  );

  if (others.length === 0) {
    return {
      mode: "last-member" as const,
      products: [...membership.household.products, ...personalProducts],
    };
  }

  return { mode: "leave-shared" as const, products: personalProducts };
}

export async function detachUserFromHouseholdForDeletion(userId: string) {
  const membership = await prisma.householdMember.findUnique({
    where: { userId },
    include: {
      household: {
        include: {
          members: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!membership) {
    return;
  }

  const others = membership.household.members.filter(
    (member) => member.userId !== userId
  );

  if (others.length === 0) {
    await prisma.product.deleteMany({
      where: { householdId: membership.householdId },
    });
    await prisma.household.delete({
      where: { id: membership.householdId },
    });
    return;
  }

  const successorId =
    membership.role === HOUSEHOLD_OWNER_ROLE
      ? others[0]!.userId
      : (membership.household.members.find(
          (member) => member.role === HOUSEHOLD_OWNER_ROLE
        )?.userId ?? others[0]!.userId);

  await prisma.$transaction(async (tx) => {
    if (membership.role === HOUSEHOLD_OWNER_ROLE) {
      await tx.householdMember.update({
        where: { userId: successorId },
        data: { role: HOUSEHOLD_OWNER_ROLE },
      });
    }

    await tx.product.updateMany({
      where: { userId, householdId: membership.householdId },
      data: { userId: successorId },
    });

    await tx.householdInvite.updateMany({
      where: { invitedById: userId, householdId: membership.householdId },
      data: { invitedById: successorId },
    });

    await tx.householdMember.delete({
      where: { id: membership.id },
    });
  });
}
