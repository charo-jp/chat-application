import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createFileRoute } from "@tanstack/react-router";
import CharoPicture from "@/assets/charo.jpeg";
import { User, Cake, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/profile/")({
  component: () => <ProfilePage />,
});
// TODO: Change the layout whether it is for own profile or for viewing others' profiles.
// TODO: use the shared Profile type
type Profile = {
  birthday: Date;
  statusMessage?: string;
  profilePicUrl?: string;
  userId: string;
  username: string;
};

const DummyProfile: Profile = {
  birthday: new Date("2011-02-08"),
  statusMessage: "They don't know that we know they know we know",
  profilePicUrl: CharoPicture,
  username: "charo",
  userId: "43243243243243",
};

const ProfilePage = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-2 w-auto m-4 p-4 bg-slate-300 rounded-md">
      <Avatar className="size-32 m-auto">
        <AvatarImage src={CharoPicture} alt="Profile Picture" />
        <AvatarFallback>PP</AvatarFallback>
      </Avatar>
      <ProfileInfo icon={User} label="Username" data={DummyProfile.username} />
      <ProfileInfo
        icon={Cake}
        label="Birthday"
        data={DummyProfile.birthday.toISOString().split("T")[0]}
      />
      {DummyProfile.statusMessage && (
        <ProfileInfo
          icon={MessageCircle}
          label="Status Message"
          data={DummyProfile.statusMessage}
        />
      )}
    </div>
  );
};

type ProfileInfoProps = {
  icon: LucideIcon;
  label: string;
  data: string;
};

const ProfileInfo = (props: ProfileInfoProps) => {
  // icon: Icon is a component alias used to render the icon component.
  const { icon: Icon, label, data } = props;
  return (
    <div className="flex flex-row items-center justify-start gap-3 w-full">
      {/* Set the minimum width and height to prevent svg shrinking */}
      <Icon className="size-8 min-w-8 min-h-8" />
      <div className="[&>p]:leading-tight">
        <p className="font-bold">{label}</p>
        <p>{data}</p>
      </div>
    </div>
  );
};
