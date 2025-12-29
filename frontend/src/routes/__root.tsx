import { Header } from "@/components/layout/Header";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

// Link to the manual setup: https://tanstack.com/router/v1/docs/framework/react/installation/manual
const RootLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
      {/* meta.env.DEV is true when running in development mode (when running npm run dev) */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
};

/**
 * It creates a root route that can be used as a route-tree.
 */
export const Route = createRootRoute({ component: RootLayout });
