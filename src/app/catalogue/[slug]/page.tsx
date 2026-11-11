import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";
import UspList from "@/components/catalogue/UspList";
import { Availability, Prices, ProductCard } from "@/components/catalogue/ProductCard";
import Gallery from "@/components/catalogue/Gallery";
import AddToBasketForm from "@/components/catalogue/AddToBasketForm";
import ShareButtons from "@/components/catalogue/ShareButtons";
import { ancestorsOf, getCategoryTree, productCardSelect } from "@/lib/catalogue";
import { srcSet } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

const load = (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    include: {
      manufacturer: true,
      category: true,
      reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } },
    },
  });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: `${p.name} — ${p.sku}`,
    openGraph: { title: p.name, images: p.images[0] ? [p.images[0]] : undefined },
  };
}

function Stars({ score }: { score: number }) {
  return (
    <span className="star-rating" aria-label={`${score} out of 5`}>
      {"★".repeat(score)}
      <span className="text-muted">{"★".repeat(5 - score)}</span>
    </span>
  );
}

export default async function ProductPage({ params }: Props) {
  const product = await load((await params).slug);
  if (!product) notFound();

  const { byId } = await getCategoryTree();
  const node = product.categoryId ? byId.get(product.categoryId) : undefined;
  const chain = node ? ancestorsOf(node, byId) : [];

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    orderBy: [{ inStock: "desc" }, { popularity: "desc" }],
    take: 6,
    select: productCardSelect,
  });

  const maxQty = product.inStock ? Math.max(1, Math.min(9, product.stockQty)) : 0;
  const images = product.images.length ? product.images : product.cardImage ? [product.cardImage] : [];
  const thumbs = product.thumbs.length === images.length ? product.thumbs : images;

  return (
    <>
      <link type="text/css" href="/static/webpack_bundles/product.css" rel="stylesheet" />
      <link type="text/css" href="/static/webpack_bundles/product_gallery.css" rel="stylesheet" />
      <link type="text/css" href="/static/webpack_bundles/product_gallery_horizontally.css" rel="stylesheet" />
      <div className="container">
        <Breadcrumb
          truncated
          items={[
            ...chain.map((c) => ({ name: c.name, href: `/catalogue/category/${c.path}/` })),
            { name: product.name },
          ]}
        />
        <div id="messages"></div>
        <div className="content-header">
          <h1></h1>
        </div>
        <div className="content">
          <div id="content-inner">
            <article className="product-page">
              <div className="product-detail-main row">
                <div className="product-detail-main__card col-md-9">
                  <div className="product-detail-card product-card">
                    <div className="row">
                      <div className="col-md-4">
                        <Gallery images={images} thumbs={thumbs} alt={product.name} />
                      </div>
                      <div className="col-md-8">
                        <section className="product-details mr-md-5">
                          <div className="product-title">
                            <h1>{product.name}</h1>
                            <p className="product-model-number">Product code: {product.sku}</p>
                            {product.manufacturer?.logo && (
                              <img
                                className="img-fluid float-right"
                                src={product.manufacturer.logo}
                                srcSet={srcSet(product.manufacturer.logo)}
                                alt={`Manufacturer: ${product.manufacturer.name}`}
                              />
                            )}
                          </div>
                          <div className="product-actions">
                            <Availability inStock={product.inStock} />
                            <Prices price={product.price} oldPrice={product.oldPrice} />
                            <AddToBasketForm productId={product.id} maxQty={maxQty} />
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="product-detail-main__usps col-md-3">
                  <UspList variant="product" />
                </div>
              </div>

              <div className="product-subsidiary-content">
                <section>
                  <div className="product-detail-card p-4">
                    <h2>Product details</h2>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th>SKU</th>
                          <td>{product.sku}</td>
                        </tr>
                        {product.manufacturer && (
                          <tr>
                            <th>Manufacturer</th>
                            <td>{product.manufacturer.name}</td>
                          </tr>
                        )}
                        {product.vehicleText.length > 0 && (
                          <tr>
                            <th>Applicable vehicles</th>
                            <td>
                              {product.vehicleText.map((v, i) => (
                                <span key={i}>
                                  {v}
                                  {i < product.vehicleText.length - 1 && <br />}
                                </span>
                              ))}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <ShareButtons name={product.name} image={images[0]} productId={product.id} />
                  </div>
                </section>

                <section className="product-reviews">
                  <h3 className="subheading">
                    <span className="subheading-text">Reviews</span>
                  </h3>
                  <div className="catalogue-reviews">
                    {product.reviews.length === 0 ? (
                      <p>This product does not have any reviews yet.</p>
                    ) : (
                      <div className="mb-3">
                        {product.reviews.map((r) => (
                          <div className="card mb-2" key={r.id}>
                            <div className="card-body">
                              <h5 className="card-title mb-1">
                                <Stars score={r.score} /> {r.title}
                              </h5>
                              <p className="text-muted small mb-2">
                                {r.name} — {r.createdAt.toLocaleDateString("en-GB")}
                              </p>
                              <p className="mb-0">{r.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href={`/catalogue/${product.slug}/reviews/add/#addreview`} className="btn btn-primary">
                      Add your review
                    </Link>
                  </div>
                </section>

                <section className="product-recommended"></section>

                {related.length > 0 && (
                  <section className="product-related">
                    <h3 className="subheading">
                      <span className="subheading-text">You may also like</span>
                    </h3>
                    <div className="product-list row">
                      {related.map((r) => (
                        <div className="product-item d-flex col-12 col-sm-6 col-md-4 col-xl-3" key={r.id}>
                          <ProductCard product={r} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}
