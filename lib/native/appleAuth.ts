import { Capacitor } from "@capacitor/core";

export interface AppleAuthResult {
  userId: string;
  email?: string;
}

export async function signInWithApple(): Promise<AppleAuthResult> {
  if (!Capacitor.isNativePlatform()) {
    return {
      userId: `dev_${crypto.randomUUID()}`
    };
  }

  const AppleAuthPlugin = (window as unknown as { AppleSignIn?: { authorize: () => Promise<{ user: string; email?: string }> } })
    .AppleSignIn;

  if (!AppleAuthPlugin?.authorize) {
    throw new Error("Apple Sign In plugin is not registered in this build.");
  }

  const result = await AppleAuthPlugin.authorize();
  return {
    userId: result.user,
    email: result.email
  };
}
