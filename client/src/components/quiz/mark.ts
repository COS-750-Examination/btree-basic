import type { QuizItem } from '@btree/shared';
import { RULE_LABELS } from './rules';

export interface Answer {
  correct: boolean;
  feedback: string;
  misconception?: string;
}

/** Marks an answer for any item type. Pure, so it is unit-testable. */
export function mark(item: QuizItem, choice: string): Answer {
  switch (item.type) {
    case 'mcq':
    case 'bst-mcq':
    case 'predict-tree': {
      const opt = item.options.find((o) => o.id === choice);
      return {
        correct: Boolean(opt?.correct),
        feedback: opt?.feedback ?? '',
        misconception: opt?.misconception,
      };
    }
    case 'pick-median': {
      const picked = Number(choice);
      if (picked === item.answer) {
        return {
          correct: true,
          feedback: `Yes. ${item.answer} is the middle key of the full branch, so it moves up to the parent.`,
        };
      }
      if (picked === item.insertKey) {
        return {
          correct: false,
          misconception: 'promote-new-key',
          feedback:
            'Not quite. The key that moves up is the middle one after insertion, not the new one.',
        };
      }
      return {
        correct: false,
        misconception: 'wrong-median',
        feedback: `Not quite. Put ${item.insertKey} into the leaf first, then pick the middle key of the overflowing branch.`,
      };
    }
    case 'valid-or-not': {
      const [verdict, rule] = choice.split(':');
      const saysValid = verdict === 'valid';
      if (saysValid !== item.valid) {
        return {
          correct: false,
          feedback: item.valid
            ? 'This tree follows every rule. Check each one again.'
            : `It breaks a rule: ${RULE_LABELS[item.brokenRule as keyof typeof RULE_LABELS] ?? item.brokenRule}.`,
        };
      }
      if (!item.valid && item.brokenRule && rule !== item.brokenRule) {
        return {
          correct: false,
          feedback: 'Right, it is not valid, but a different rule is broken. Look again.',
        };
      }
      return {
        correct: true,
        feedback: item.valid
          ? 'Yes, every rule holds.'
          : `Yes: ${RULE_LABELS[item.brokenRule as keyof typeof RULE_LABELS] ?? 'a rule is broken'}.`,
      };
    }
    case 'trace-path':
      return {
        correct: choice === item.answerPath.map((n) => n.join(',')).join('|'),
        feedback: 'Compare the key with each node on the way down.',
      };
  }
}
