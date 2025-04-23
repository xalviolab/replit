import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, ProtectedLayout } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Lesson from "@/pages/lesson";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth-page";

// Layout for unprotected pages like auth
function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth">
        <AuthLayout>
          <AuthPage />
        </AuthLayout>
      </Route>
      
      {/* Protected routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/lesson/:id" component={Lesson} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/admin" component={() => <div>Admin Dashboard</div>} />
      <ProtectedRoute path="/admin/users" component={() => <div>Users Management</div>} />
      <ProtectedRoute path="/admin/modules" component={() => <div>Modules Management</div>} />
      <ProtectedRoute path="/admin/lessons" component={() => <div>Lessons Management</div>} />
      <ProtectedRoute path="/admin/badges" component={() => <div>Badges Management</div>} />
      <ProtectedRoute path="/admin/subscriptions" component={() => <div>Subscriptions Management</div>} />
      
      {/* 404 route */}
      <Route>
        <ProtectedLayout>
          <NotFound />
        </ProtectedLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
