import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Heart, BookOpen, Award, Brain, Lightbulb, Sparkles } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginFormData, setLoginFormData] = useState({ username: "", password: "" });
  const [registerFormData, setRegisterFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
  });
  const [passwordError, setPasswordError] = useState("");
  
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // If user is already logged in, redirect to dashboard
  if (user) {
    navigate("/");
    return null;
  }
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginFormData);
  };
  
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password validation
    if (registerFormData.password !== registerFormData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    if (registerFormData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    setPasswordError("");
    
    // Create user
    registerMutation.mutate({
      username: registerFormData.username,
      email: registerFormData.email,
      password: registerFormData.password,
      full_name: registerFormData.full_name,
    });
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="flex flex-col-reverse md:flex-row w-full">
        {/* Auth Form section */}
        <div className="flex flex-col w-full md:w-1/2 p-4 md:p-8 items-center justify-center">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="flex items-center justify-center md:justify-start mb-6">
              <Heart className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-3xl font-bold">CardioEdu</h1>
            </div>
            
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Welcome to CardioEdu</CardTitle>
                <CardDescription>
                  Continue your learning journey with our interactive platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  {/* Login Form */}
                  <TabsContent value="login">
                    <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          placeholder="Enter your username" 
                          value={loginFormData.username}
                          onChange={(e) => setLoginFormData({...loginFormData, username: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          <a href="/auth/reset-password" className="text-sm text-muted-foreground hover:text-primary">
                            Forgot password?
                          </a>
                        </div>
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="Enter your password" 
                          value={loginFormData.password}
                          onChange={(e) => setLoginFormData({...loginFormData, password: e.target.value})}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  {/* Register Form */}
                  <TabsContent value="register">
                    <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Username</Label>
                        <Input 
                          id="register-username" 
                          placeholder="Choose a username" 
                          value={registerFormData.username}
                          onChange={(e) => setRegisterFormData({...registerFormData, username: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="Enter your email" 
                          value={registerFormData.email}
                          onChange={(e) => setRegisterFormData({...registerFormData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name (Optional)</Label>
                        <Input 
                          id="full-name" 
                          placeholder="Enter your full name" 
                          value={registerFormData.full_name}
                          onChange={(e) => setRegisterFormData({...registerFormData, full_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input 
                          id="register-password" 
                          type="password" 
                          placeholder="Create a password" 
                          value={registerFormData.password}
                          onChange={(e) => setRegisterFormData({...registerFormData, password: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          placeholder="Confirm your password" 
                          value={registerFormData.confirmPassword}
                          onChange={(e) => setRegisterFormData({...registerFormData, confirmPassword: e.target.value})}
                          required
                        />
                        {passwordError && (
                          <p className="text-sm text-destructive">{passwordError}</p>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  By continuing, you agree to CardioEdu's Terms of Service and Privacy Policy.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Hero section - only visible on medium screens and up */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">An interactive way to master new skills</h1>
              <p className="text-xl text-muted-foreground">
                CardioEdu combines engaging lessons with a path-based progression system,
                making learning effective and enjoyable.
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start space-x-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium">Structured Learning</h3>
                  <p className="text-sm text-muted-foreground">Follow clear pathways to build knowledge systematically</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Award className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium">Earn Badges</h3>
                  <p className="text-sm text-muted-foreground">Get recognized for your achievements and milestones</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium">Adaptive Learning</h3>
                  <p className="text-sm text-muted-foreground">Content adjusts to your learning pace and style</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium">Interactive Content</h3>
                  <p className="text-sm text-muted-foreground">Engage with lessons through quizzes and activities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}