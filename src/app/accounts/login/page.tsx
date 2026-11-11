import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { LoginForm } from "@/components/forms/AccountForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/accounts/";
  if (await getCurrentUser()) redirect(safeNext);
  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Login" }]} />
      <div id="messages"></div>
      <div className="content">
        <div id="content-inner">
          <div className="row">
            <div className="col-sm-6 login_form mb-3">
              <div className="customer-login">
                <h3>Login</h3>
                <p className="customer-login-help">Sign in to your account</p>
                <LoginForm next={next} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
