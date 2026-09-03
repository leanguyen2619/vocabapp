import { prisma } from "@/lib/prisma";

/**
 * Fires when a student's auto-continued assignment (see deriveLastAssignmentRule /
 * pickTodaysWordIds) can no longer fill a fresh batch from the topic+level of their last explicit
 * assignment — the admin needs to manually assign from a different topic. Always available as the
 * admin-panel badge (StudentSummary.assignRuleExhausted); this function additionally emails the
 * admin once the two env vars below are set.
 *
 * No email provider is wired in yet — nothing is sent until ADMIN_NOTIFICATION_EMAIL and
 * RESEND_API_KEY (https://resend.com, free tier) are set. Swap the provider below if a different
 * one is preferred; the call site (pickTodaysWordIds) doesn't need to change either way.
 */
export async function notifyAdminAssignmentExhausted(params: {
  studentId: string;
  studentName: string;
  topicId: number;
  levelId: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!adminEmail || !apiKey) {
    console.warn(
      `[assignment-exhausted] ${params.studentName} (${params.studentId}) has run out of new words ` +
        `in topic ${params.topicId} / level ${params.levelId} — set ADMIN_NOTIFICATION_EMAIL and ` +
        `RESEND_API_KEY to email this instead of just logging it.`
    );
    return;
  }

  const topic = await prisma.topic.findUnique({ where: { id: params.topicId } });
  const level = await prisma.level.findUnique({ where: { id: params.levelId } });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "VocabApp <onboarding@resend.dev>",
      to: adminEmail,
      subject: `VocabApp: hết từ để giao cho ${params.studentName}`,
      text:
        `Học sinh ${params.studentName} (${params.studentId}) đã học hết từ mới trong chủ đề ` +
        `"${topic?.topic ?? params.topicId}" ở level ${level?.level ?? params.levelId}. ` +
        `Vui lòng vào trang quản trị để giao thủ công một chủ đề khác.`,
    }),
  }).catch((err: unknown) => {
    console.error("[assignment-exhausted] failed to send notification email:", err);
  });
}
