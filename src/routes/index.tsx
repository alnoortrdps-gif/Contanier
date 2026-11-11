import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Desk } from "@/tracker/desk";
import { GmailGate } from "@/tracker/gate";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { user, isPending } = useCurrentUserState();
  if (user) return <Desk />;
  return <GmailGate checking={isPending} />;
}