import { createFileRoute } from "@tanstack/react-router";
import { Desk } from "@/tracker/desk";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <Desk />;
}