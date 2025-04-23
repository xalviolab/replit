import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType | React.FC;
}

// Layout component for protected routes
export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <ProtectedLayout>
        <Component />
      </ProtectedLayout>
    </Route>
  );
}