import AuthForm from "../../components/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
