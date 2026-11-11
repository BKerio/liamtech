import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { LoginForm, RegisterCard } from "@/components/forms/AccountForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Login or register" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/accounts/");
  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Login or register" }]} />
      <div id="messages"></div>
      <div className="content">
        <div id="content-inner">
          <div className="row">
            <div className="col-sm-6 login_form mb-3">
              <div className="customer-login">
                <h3>Login</h3>
                <p className="customer-login-help">If you already have an account with us</p>
                <LoginForm next={next} />
              </div>
            </div>
            <div className="col-sm-6 register_form">
              <div className="customer-login customer-login-register">
                <h3>Create an account</h3>
                <p className="customer-login-help">Save time later</p>
                <RegisterCard next={next} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
