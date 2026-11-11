import Link from "next/link";
import prisma from "@/lib/prisma";
import { getMakes, productCardSelect } from "@/lib/catalogue";
import { srcSet } from "@/lib/format";
import { ProductCard } from "@/components/catalogue/ProductCard";
import SlickCarousel from "@/components/carousel/SlickCarousel";
import ImageCarousel from "@/components/carousel/ImageCarousel";
import VehicleForm from "@/components/forms/VehicleForm";
import UspList from "@/components/catalogue/UspList";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [makes, sections, banners, brands] = await Promise.all([
    getMakes(),
    prisma.homeSection.findMany({
      orderBy: { position: "asc" },
      include: {
        items: { orderBy: { position: "asc" }, include: { product: { select: productCardSelect } } },
      },
    }),
    prisma.banner.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.manufacturer.findMany({ where: { featured: true }, orderBy: { position: "asc" } }),
  ]);
  const by = (p: string) => banners.filter((b) => b.placement === p);

  return (
    <div className="container">
      {/* original: body.amex-home-wide .page-main>.container { max-width: 1400px } (home page only) */}
      <style>{`@media(min-width:1200px){.page-main>.container{max-width:1400px}}`}</style>
      <div id="messages"></div>
      <div className="content">
        <div id="content-inner">
          <div className="row">
            <div className="col-lg-9">
              <div className="cms-body">
                <section className="block block-header">
                  <div className="row">
                    <div className="block-header-search col-xl-3 d-xl-flex">
                      <div className="card">
                        <div className="card-body">
                          <div className="block-header-search-lg d-lg-flex">
                            <h3>Shop now</h3>
                            <VehicleForm makes={makes} variant="home" action="/catalogue/" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="block-header-carousel px-0 px-xl-2 col-xl-9">
                      <ImageCarousel slides={by("hero")} />
                    </div>
                  </div>
                </section>

                <section className="block block-usp_list">
                  <UspList />
                </section>

                {sections.map((s) => (
                  <section className="block block-featured_products" key={s.id}>
                    <h3 className="subheading">
                      <span className="subheading-text">{s.title}</span>
                    </h3>
                    <SlickCarousel variant="products">
                      {s.items.map((i) => (
                        <ProductCard key={i.id} product={i.product} />
                      ))}
                    </SlickCarousel>
                  </section>
                ))}

                {by("mid").length > 0 && (
                  <section className="block block-carousel">
                    <ImageCarousel slides={by("mid")} />
                  </section>
                )}

                <section className="block block-featured_images">
                  <div className="row"></div>
                </section>

                {by("featured_link").length > 0 && (
                  <section className="block block-featured_links">
                    <h3 className="subheading">
                      <span className="subheading-text">More products from {SITE.shortName}</span>
                    </h3>
                    <SlickCarousel variant="links">
                      {by("featured_link").map((b) => (
                        <a href={b.href ?? undefined} key={b.id}>
                          <img alt={b.alt} src={b.image} loading="lazy" className="img-fluid d-block mx-auto" />
                          <span className="caption">{b.caption}</span>
                        </a>
                      ))}
                    </SlickCarousel>
                  </section>
                )}

                <section className="block block-featured_manufacturers">
                  <h3 className="subheading">
                    <span className="subheading-text">Our product brands</span>
                  </h3>
                  <ul className="block-manufacturers__list">
                    {brands.map((m) => (
                      <li className="block-manufacturers__item" key={m.id}>
                        <Link title={m.name} href={`/catalogue/manufacturer/${m.slug}/`}>
                          <img alt={m.name} className="img-fluid" loading="lazy" src={m.logo ?? undefined} srcSet={srcSet(m.logo)} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
            <aside className="col-lg-3 cms-sidebar-wrap">
              <div className="cms-sidebar">
                {by("sidebar").map((b) => (
                  <section className="block block-ad_image" key={b.id}>
                    <a href={b.href ?? undefined}>
                      {b.mobileImage ? (
                        <>
                          <img alt={b.alt} src={b.image} loading="lazy" className="img-fluid d-none d-lg-block mx-auto" />
                          <img alt={b.alt} src={b.mobileImage} loading="lazy" className="img-fluid d-block d-lg-none mx-auto" />
                        </>
                      ) : (
                        <img alt={b.alt} src={b.image} loading="lazy" className="img-fluid d-block mx-auto" />
                      )}
                    </a>
                  </section>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
