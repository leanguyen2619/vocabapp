import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, PartyPopper } from "lucide-react";

import { PracticeSession } from "@/components/practice-session";
import { Button } from "@/components/ui/button";
import { getMyReviewWordsAction, listTopicsAction } from "@/lib/actions/vocabulary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";

export default async function ReviewPracticePage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [reviewWords, topics] = await Promise.all([getMyReviewWordsAction(), listTopicsAction()]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {dict.common.backToDashboard}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">{dict.common.brand}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        {reviewWords.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper className="size-8 text-primary" />
            </div>
            <p className="text-muted-foreground">{dict.studentDashboard.reviewEmpty}</p>
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              {dict.common.backToDashboard}
            </Button>
          </div>
        ) : (
          <PracticeSession vocabList={reviewWords} topics={topics} dict={dict} />
        )}
      </main>
    </div>
  );
}
