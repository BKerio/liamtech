import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

export default function NotFound() {
  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Page not found" }]} />
      <div className="content-header">
        <h1>Page not found</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <p>Sorry, we couldn&apos;t find the page you were looking for.</p>
          <p>
            <Link href="/" className="btn btn-primary">
              Back to the homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
