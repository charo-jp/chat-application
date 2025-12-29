import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

type Chat = {
  chatId: string;
  chatName: string;
  chatPicture: string;
  latestMessage: string;
};

const DummyData: Chat[] = [
  {
    chatId: "1",
    chatName: "General",
    chatPicture: "https://placekitten.com/200/200",
    latestMessage: "Hello World!",
  },
  {
    chatId: "2",
    chatName: "Random",
    chatPicture: "https://placekitten.com/201/201",
    latestMessage: "Random stuff",
  },
];

function Index() {
  return <div>Hello "/"!</div>;
}
