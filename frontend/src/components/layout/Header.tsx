import { Link } from "@tanstack/react-router";
import CharoPicture from "@/assets/charo.jpeg";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface HeaderProps {
  onLogin?: () => void;
  onLogout?: () => void;
  onCreateAccount?: () => void;
}
// Use Zustand for global state management of user authentication in the future

export const Header = () => {
  // TODO: Change this variable into a funcitonal one.
  const isLoggedIn = true;
  return (
    <header className="flex items-center justify-between border-b border-gray-300 px-5 py-4">
      <h1 className="font-bold">
        <Link to="/">Howdi</Link>
      </h1>
      {isLoggedIn ? <UserMenu /> : <>This is not logged in</>}
    </header>
  );
};

export type UserMenuProps = {
  name: string;
  userId: string;
  // S3 URL is expected to store in userId. Presigned URL will be passed down from the backend.
  // Pre-signed URL
  avatarImage: string;
  avatarImageAlt: string;
};

/**
 * A dropdown menu for users
 * It is used only for logged-in users.
 */
const UserMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full  ">
        <Avatar>
          <AvatarImage src={CharoPicture} alt={"Default Avatar"} />
          <AvatarFallback>CP</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link to="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to="/settings">Settings</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
