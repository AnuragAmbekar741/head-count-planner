import { useNavigate } from "@tanstack/react-router";
import { TrendingUp, TrendingDown } from "lucide-react";
import { TokenCookies } from "@/utils/cookie";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useGoogleAuth } from "@/hooks/auth/useGoogleAuth";
import { Loader2 } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const isAuthenticated = TokenCookies.hasTokens();
  const { mutate: login, isPending } = useGoogleAuth();

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

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    navigate({ to: "/dashboard/overheads" });
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="container mx-auto max-w-4xl text-center space-y-8">
        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            Will you make it ?
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              or break it ?
            </span>
            <br />
            {isPending ? (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-lg font-medium text-muted-foreground">
                  Signing you in...
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center pt-6">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  theme="filled_black"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                />
              </div>
            )}
          </h1>
        </div>

        {/* Subheading */}
        <p className="text-md md:text-md text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Plan your headcount and costs with precision. Know your runway before
          it runs out.
        </p>

        {/* Visual Indicators */}
        <div className="flex items-center justify-center gap-8 py-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">Plan</div>
            <p className="text-sm text-muted-foreground">
              Create scenarios and model <br /> your costs
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">Track</div>
            <p className="text-sm text-muted-foreground">
              Monitor burn rate and runway <br /> in real-time
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">Decide</div>
            <p className="text-sm text-muted-foreground">
              Make informed decisions <br /> with clarity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
