import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useGoogleAuth } from "@/hooks/auth/useGoogleAuth";
import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BarChart3,
  Target,
} from "lucide-react";

export default function Auth() {
  const { mutate: login, isPending } = useGoogleAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      login(
        { idToken: credentialResponse.credential },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard/overheads" });
          },
        }
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="container mx-auto max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Will you make it ?
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  or break it ?
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Plan your headcount and costs with precision. Know your runway
                before it runs out.
              </p>
            </div>

            {/* Visual Indicators */}
            <div className="flex items-center gap-8 py-4">
              <div className="flex items-center gap-2 text-green-500">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm font-medium">Growth</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2 text-red-500">
                <TrendingDown className="h-6 w-6" />
                <span className="text-sm font-medium">Burn</span>
              </div>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 gap-6 pt-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">Plan</div>
                  <p className="text-sm text-muted-foreground">
                    Create scenarios and model your costs
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">Track</div>
                  <p className="text-sm text-muted-foreground">
                    Monitor burn rate and runway in real-time
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">Decide</div>
                  <p className="text-sm text-muted-foreground">
                    Make informed decisions with clarity
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className="shadow-2xl border-2 backdrop-blur-sm bg-card/95">
              <CardHeader className="space-y-3 text-center pb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight">
                  Welcome
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  Sign in to start planning your headcount and costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                {isPending ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Signing you in...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        theme="outline"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                      />
                    </div>

                    {/* Visual Indicators - Mobile */}
                    <div className="flex items-center justify-center gap-6 pt-4 border-t lg:hidden">
                      <div className="flex items-center gap-2 text-green-500">
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-xs font-medium">Growth</span>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <div className="flex items-center gap-2 text-red-500">
                        <TrendingDown className="h-5 w-5" />
                        <span className="text-xs font-medium">Burn</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
