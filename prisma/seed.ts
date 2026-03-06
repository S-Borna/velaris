// Copyright (c) Said Borna. All rights reserved.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEMO_EMAIL = "said@saidborna.com";
const DEMO_PASSWORD = "REDACTED-PASSWORD";
const DEMO_NAME = "Said Borna";
const WORKSPACE_NAME = "Personal Workspace";

/**
 * Seed the database with a demo user and workspace.
 */
async function main(): Promise<void> {
    const existing = await prisma.user.findUnique({
        where: { email: DEMO_EMAIL },
    });

    if (existing) {
        console.log(`User ${DEMO_EMAIL} already exists — skipping.`);
        return;
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            email: DEMO_EMAIL,
            fullName: DEMO_NAME,
            passwordHash,
        },
    });

    const workspace = await prisma.workspace.create({
        data: {
            name: WORKSPACE_NAME,
        },
    });

    await prisma.workspaceMember.create({
        data: {
            workspaceId: workspace.id,
            userId: user.id,
            role: "owner",
        },
    });

    console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    console.log(`Created workspace: ${WORKSPACE_NAME}`);
}

main()
    .catch((error: Error) => {
        console.error("Seed failed:", error.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
