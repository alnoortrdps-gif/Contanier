import { createFileRoute } from "@tanstack/react-router";
import { GmailGate } from "@/tracker/gate";

export const Route = createFileRoute("/login")({
  component: GmailGate,
});
