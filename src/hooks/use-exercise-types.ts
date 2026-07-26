"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_EXERCISE_TYPES,
  getExerciseTypes,
  saveExerciseTypes,
  type ExerciseTypeConfig,
} from "@/lib/exercise-types";

interface State {
  types: ExerciseTypeConfig[];
  loaded: boolean;
}

export function useExerciseTypes() {
  const [{ types, loaded }, setState] = useState<State>({
    types: DEFAULT_EXERCISE_TYPES,
    loaded: false,
  });

  useEffect(() => {
    // Syncing from localStorage (an external system unavailable during SSR) — the
    // default config above is what the server renders, avoiding a hydration mismatch.
    const stored = getExerciseTypes();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ types: stored, loaded: true });
  }, []);

  const updateType = (code: string, patch: Partial<ExerciseTypeConfig>) => {
    setState((current) => {
      const nextTypes = current.types.map((t) => (t.code === code ? { ...t, ...patch } : t));
      saveExerciseTypes(nextTypes);
      return { ...current, types: nextTypes };
    });
  };

  return { types, loaded, updateType };
}
