import Avatar from "@/components/Avatar";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  message: Message;
  streaming?: boolean;
};

// One chat bubble. Assistant messages sit on the left with a small avatar; user
// messages are right-aligned in a filled bubble.
export default function ChatMessage({ message, streaming }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-neutral-800 px-4 py-2.5 text-[15px] text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <Avatar size={32} />
      <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-2.5 text-[15px] text-neutral-100">
        {message.content}
        {streaming && (
          <span className="ml-1 inline-flex gap-1 align-middle">
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-neutral-400" />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-neutral-400" style={{ animationDelay: "0.2s" }} />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-neutral-400" style={{ animationDelay: "0.4s" }} />
          </span>
        )}
      </div>
    </div>
  );
}
