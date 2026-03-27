import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import Layout from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useNotifications } from "./hooks/useNotifications";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Login from "./pages/Login";
import SubjectDetail from "./pages/SubjectDetail";
import Subjects from "./pages/Subjects";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { requestPermission } = useNotifications();

  useEffect(() => {
    if (identity) {
      requestPermission();
    }
  }, [identity, requestPermission]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <Login />;
  }

  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: () => (
    <AuthGuard>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGuard>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: Dashboard,
});

const subjectsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/subjects",
  component: Subjects,
});

const subjectDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/subjects/$subjectId",
  component: SubjectDetail,
});

const goalsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/goals",
  component: Goals,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    subjectsRoute,
    subjectDetailRoute,
    goalsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
