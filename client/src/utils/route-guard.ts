import { redirect } from "@tanstack/react-router";
import { TokenCookies } from "@/utils/cookie";

export const requireAuth = async () => {
  if (!TokenCookies.hasTokens()) {
    throw redirect({ to: "/auth" });
  }
};

export const requireGuest = async () => {
  if (TokenCookies.hasTokens()) {
    throw redirect({ to: "/dashboard" });
  }
};
