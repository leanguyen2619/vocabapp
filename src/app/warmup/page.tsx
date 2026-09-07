import {} from "lucide-react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { FillBlankGame } from "@/components/fill-blank-game";
import { ListeningGame } from "@/components/listening-game";
import { ListeningComprehensionGame } from "@/components/listening-comprehension-game";
import { LogoutWithPasswordButton } from "@/components/logout-with-password-button";
import { MatchingGame } from "@/components/matching-game";
import { PosClassificationGame } from "@/components/pos-classification-game";
import { QuizSession } from "@/components/quiz-session";
import { ReadingComprehensionGame } from "@/components/reading-comprehension-game";
import { ReadingPracticeGame } from "@/components/reading-practice-game";
import { SentenceWritingExercise } from "@/components/sentence-writing-exercise";
import { SynonymAntonymGame } from "@/components/synonym-antonym-game";
import { TypingGame } from "@/components/typing-game";
import { WordFormationGame } from "@/components/word-formation-game";
import { WordTransformationGame } from "@/components/word-transformation-game";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { BrandWordmark } from "@/components/brand-wordmark";
import {
  getFillBlankQuestionsAction,
  getListeningComprehensionQuestionsAction,
  getMyReadingPassageAction,
  getMyReadingTextAction,
  getSentenceWritingPromptsAction,
  getSynonymAntonymQuestionsAction,
  getWordFormationPromptsAction,
  getWordTransformationPromptsAction,
} from "@/lib/actions/practice-content";
import {
  getMyQuizQuestionsAction,
  getMyWordsForScopeAction,
  getPosClassificationItemsAction,
  listTopicsAction,
} from "@/lib/actions/vocabulary";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getMyStudentLevelIndexAction } from "@/lib/actions/levels";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { getLocale } from "@/lib/i18n/locale";
import { buildPosQuestions, prepareWordFormation } from "@/lib/practice-prep";
import { getCurrentAccount } from "@/lib/session";
import { B1_LEVEL_ORDINAL, shuffle } from "@/lib/utils";
import type { PracticeTypeCode } from "@/types";

// Warmup is meant to be a quick daily routine (3 short exercises), not a full pass through the
// content bank — the "mixed"-scoped types below (matching/typing/listening) are already naturally
// bounded to the student's own small daily word set, but the ones that pull straight from a
// practice-content bank (fill_blank, synonym_antonym, word_formation, word_transformation,
// sentence_writing, listening_comprehension) had no cap at all: a bank of hundreds of questions
// meant a single warmup "bài" could run to hundreds of "câu" instead of the intended handful.
const WARMUP_QUESTION_CAP = 10;

async function renderGameFor(code: PracticeTypeCode, dict: Dictionary, showEnglishDefinition: boolean) {
  switch (code) {
    case "multiple_choice": {
      const [questions, topics] = await Promise.all([
        getMyQuizQuestionsAction("mixed"),
        listTopicsAction(),
      ]);
      return <QuizSession questions={questions} topics={topics} dict={dict} warmupCode={code} />;
    }
    case "matching": {
      const vocabList = await getMyWordsForScopeAction("mixed");
      return (
        <MatchingGame
          leftItems={shuffle(vocabList)}
          rightItems={shuffle(vocabList)}
          dict={dict}
          warmupCode={code}
        />
      );
    }
    case "typing": {
      const vocabList = await getMyWordsForScopeAction("mixed");
      return (
        <TypingGame
          vocabList={vocabList}
          dict={dict}
          warmupCode={code}
          showEnglishDefinition={showEnglishDefinition}
        />
      );
    }
    case "listening": {
      const vocabList = await getMyWordsForScopeAction("mixed");
      return <ListeningGame vocabList={vocabList} dict={dict} warmupCode={code} />;
    }
    case "pos_classification": {
      const [items, topics] = await Promise.all([getPosClassificationItemsAction(), listTopicsAction()]);
      return (
        <PosClassificationGame
          questions={buildPosQuestions(items)}
          topics={topics}
          dict={dict}
          warmupCode={code}
        />
      );
    }
    case "synonym_antonym": {
      const rawQuestions = await getSynonymAntonymQuestionsAction();
      const questions = shuffle(rawQuestions)
        .slice(0, WARMUP_QUESTION_CAP)
        .map((q) => ({ ...q, options: shuffle(q.options) }));
      return <SynonymAntonymGame questions={questions} dict={dict} warmupCode={code} />;
    }
    case "fill_blank": {
      const rawQuestions = await getFillBlankQuestionsAction();
      const questions = shuffle(rawQuestions)
        .slice(0, WARMUP_QUESTION_CAP)
        .map((q) => ({ ...q, options: shuffle(q.options) }));
      return <FillBlankGame questions={questions} dict={dict} warmupCode={code} />;
    }
    case "word_formation": {
      const rawPrompts = await getWordFormationPromptsAction();
      // prepareWordFormation shuffles internally, so slicing its own output still yields a random
      // subset rather than always the same first WARMUP_QUESTION_CAP prompts in bank order.
      const prompts = prepareWordFormation(rawPrompts).slice(0, WARMUP_QUESTION_CAP);
      return <WordFormationGame prompts={prompts} dict={dict} warmupCode={code} />;
    }
    case "word_transformation": {
      const rawPrompts = await getWordTransformationPromptsAction();
      const prompts = shuffle(rawPrompts).slice(0, WARMUP_QUESTION_CAP);
      return <WordTransformationGame prompts={prompts} dict={dict} warmupCode={code} />;
    }
    case "sentence_writing": {
      const rawPrompts = await getSentenceWritingPromptsAction();
      const prompts = shuffle(rawPrompts).slice(0, WARMUP_QUESTION_CAP);
      return <SentenceWritingExercise prompts={prompts} dict={dict} warmupCode={code} />;
    }
    case "listening_comprehension": {
      const rawQuestions = await getListeningComprehensionQuestionsAction();
      const questions = shuffle(rawQuestions)
        .slice(0, WARMUP_QUESTION_CAP)
        .map((q) => ({ ...q, options: shuffle(q.options) }));
      return <ListeningComprehensionGame questions={questions} dict={dict} warmupCode={code} />;
    }
    case "reading_comprehension": {
      const rawPassage = await getMyReadingPassageAction();
      const passage = rawPassage && {
        ...rawPassage,
        blanks: rawPassage.blanks.map((b) => ({ ...b, options: shuffle(b.options) })),
      };
      return <ReadingComprehensionGame passage={passage} dict={dict} warmupCode={code} />;
    }
    case "reading_practice": {
      const rawText = await getMyReadingTextAction();
      const text = rawText && {
        ...rawText,
        questions: rawText.questions.map((q) => ({ ...q, options: shuffle(q.options) })),
      };
      return <ReadingPracticeGame text={text} dict={dict} warmupCode={code} />;
    }
    case "flashcard":
      // Never actually assigned (excluded from selectWarmupTypes), but the switch must stay
      // exhaustive over PracticeTypeCode.
      redirect("/dashboard");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.warmup.title };
}

export default async function WarmupPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (account.role !== "student") redirect("/dashboard");

  const dict = getDictionary(await getLocale());
  const status = await getMyWarmupStatusAction();
  if (!status || status.types.length === 0) redirect("/dashboard");

  const remaining = status.types.filter((t) => !status.completed.includes(t));
  if (remaining.length === 0) redirect("/dashboard");

  const currentType = remaining[0];
  const stepIndex = status.completed.length + 1;
  const totalSteps = status.types.length;

  const studentLevelIndex = await getMyStudentLevelIndexAction();
  const showEnglishDefinition = studentLevelIndex >= B1_LEVEL_ORDINAL;
  const game = await renderGameFor(currentType, dict, showEnglishDefinition);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <header>
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BrandWordmark size="sm" />
          </div>
          <LogoutWithPasswordButton dict={dict} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-10 sm:py-16">
        <Card className="w-full">
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 text-center">
              <h1 className="font-heading text-xl font-semibold tracking-tight">{dict.warmup.title}</h1>
              <p className="text-sm text-muted-foreground">
                {formatMessage(dict.warmup.subtitle, { total: totalSteps })}
              </p>
            </div>

            <Progress value={((stepIndex - 1) / totalSteps) * 100}>
              <ProgressLabel>
                {formatMessage(dict.warmup.stepCounter, { current: stepIndex, total: totalSteps })}
              </ProgressLabel>
            </Progress>

            {game}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
