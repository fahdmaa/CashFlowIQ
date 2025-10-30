import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { login, register } from "@/lib/mongodb-auth";
import Logo from "@/components/logo";

export default function Login() {
  const [, navigate] = useLocation();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupError, setSignupError] = useState("");
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  // Success state
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);

    try {
      await login(loginEmail, loginPassword);

      // Show authentication success animation
      setShowAuthSuccess(true);

      // Navigate after a brief delay to show the success animation
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
      setIsLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setIsSignupLoading(true);

    try {
      await register(signupEmail, signupPassword, signupUsername || signupEmail.split('@')[0]);

      // Show success and navigate
      setShowAuthSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "Signup failed");
      setIsSignupLoading(false);
    }
  };

  // Show success animation
  if (showAuthSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-green-100 animate-bounce">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authenticated Successfully!</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome to CashFlowIQ</CardTitle>
          <CardDescription className="text-center">
            Manage your finances with intelligent insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoginLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoginLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <>
                      <span className="mr-2">Logging in...</span>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                {signupError && (
                  <Alert variant="destructive">
                    <AlertDescription>{signupError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isSignupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username (optional)</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    disabled={isSignupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isSignupLoading}
                  />
                  <p className="text-xs text-gray-500">Minimum 6 characters</p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSignupLoading}
                >
                  {isSignupLoading ? (
                    <>
                      <span className="mr-2">Creating account...</span>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>By logging in, you agree to our Terms of Service</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
