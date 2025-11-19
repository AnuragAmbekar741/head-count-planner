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
import { Loader2 } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Head Count Planner
          </CardTitle>
          <CardDescription className="text-base">
            Welcome back! Please sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPending ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Signing you in...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
