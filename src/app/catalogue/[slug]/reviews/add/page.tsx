import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";
import ReviewForm from "@/components/forms/ReviewForm";
import { getCurrentUser } from "@/lib/auth";
import { srcSet } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Add a review" };

export default async function AddReviewPage({ params }: Props) {
  const product = await prisma.product.findUnique({ where: { slug: (await params).slug } });
  if (!product) notFound();
  const user = await getCurrentUser();
  return (
    <div className="container">
      <Breadcrumb items={[{ name: product.name, href: `/catalogue/${product.slug}/` }, { name: "Add a review" }]} truncated />
      <div className="content-header">
        <h1>Leave a product review</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <div className="row">
            <div className="col-md-3 mb-3">
              <img className="img-fluid" src={product.cardImage ?? undefined} srcSet={srcSet(product.cardImage)} alt={product.name} />
              <h5 className="mt-2">{product.name}</h5>
            </div>
            <div className="col-md-9">
              <ReviewForm
                productId={product.id}
                productSlug={product.slug}
                user={user ? { name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email, email: user.email } : null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
