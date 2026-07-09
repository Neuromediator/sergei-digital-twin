type Props = {
  questions: string[];
  onPick: (question: string) => void;
  disabled?: boolean;
};

// Clickable starter-question chips, shown while the conversation is empty.
export default function SuggestedChips({ questions, onPick, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onPick(q)}
          className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-left text-sm text-neutral-200 transition-colors hover:border-neutral-600 hover:bg-neutral-800/70 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
