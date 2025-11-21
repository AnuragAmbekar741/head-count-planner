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
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

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
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-2">
          <CardHeader className="space-y-3 text-center pb-4">
            <CardTitle className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome
            </CardTitle>
            <CardDescription className="text-base md:text-lg">
              Sign in to start planning your headcount and costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

                {/* Visual Indicators */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t">
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
  );
}
