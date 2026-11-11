import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { RegisterForm } from "@/components/forms/AccountForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/accounts/");
  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Register" }]} />
      <div id="messages"></div>
      <div className="content-header">
        <h1>Register</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <div className="row">
            <div className="col-sm-6 register_form">
              <RegisterForm next={next} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
