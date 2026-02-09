type Props = {
  searchParams?: {
    q?: string;
    mode?: string;
  };
};

import { ChatSplit } from "./ChatSplit";

export default function ChatPage({ searchParams }: Props) {
  const q = (searchParams?.q ?? "").trim();
  const mode = (searchParams?.mode ?? "").trim();

  return <ChatSplit initialQuestion={q} mode={mode} />;
}

