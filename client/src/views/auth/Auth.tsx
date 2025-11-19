import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useGoogleAuth } from "@/hooks/auth/useGoogleAuth";
import { useNavigate } from "@tanstack/react-router";

export default function Auth() {
  const { mutate: login, isPending } = useGoogleAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      login(
        { idToken: credentialResponse.credential },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
          },
        }
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Head Count Planner</h1>
        <p className="text-gray-600 mb-8">Sign in to continue</p>
        <GoogleLogin onSuccess={handleGoogleLogin} />
        {isPending && <p className="mt-4">Logging in...</p>}
      </div>
    </div>
  );
}
