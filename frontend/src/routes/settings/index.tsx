import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
  component: () => <Settings />,
});

const Settings = () => {
  return <>Hello from settings</>;
};
