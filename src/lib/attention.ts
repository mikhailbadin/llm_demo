import { softmax } from './math';

/** Оценки внимания → веса: маска будущего (если causal) и softmax по строкам. */
export function scoresToWeights(scores: readonly (readonly number[])[], causal: boolean, scaleBy = 1): number[][] {
  return scores.map((row, i) => {
    const masked = row.map((s, j) => (causal && j > i ? -Infinity : s / scaleBy));
    return softmax(masked);
  });
}

/** Шаблон «смотрю на предыдущее слово»: сильная оценка на j = i − 1, слабая на себя. */
export function prevWordScores(n: number): number[][] {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j === i - 1 ? 4 : j === i ? 1 : 0)));
}
