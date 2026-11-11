import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";
import Icon from "@/components/Icon";
import ContactForm from "@/components/forms/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us" };

const tel = (p: string) => `+254${p.replace(/\D/g, "").replace(/^0/, "")}`;

export default async function ContactPage() {
  const stores = await prisma.store.findMany({ orderBy: [{ region: "asc" }, { position: "asc" }] });
  const regions = Array.from(new Set(stores.map((s) => s.region)));
  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Contact Us" }]} />
      <div id="messages"></div>
      <div className="content-header">
        <h1>Contact Us</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <div className="row contact-us">
            <div className="col-md-6">
              <div id="contact-form">
                <div className="row">
                  <div className="col-1">
                    <Icon name="phone" />
                  </div>
                  <div className="col-11">
                    <p className="tel">
                      General enquiries: <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
                    </p>
                    <p className="tel">
                      Customer Care: <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
                    </p>
                  </div>
                </div>
                {SITE.email && (
                  <div className="row">
                    <div className="col-1">
                      <Icon name="at-sign" />
                    </div>
                    <div className="col-11">
                      <p>
                        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                      </p>
                    </div>
                  </div>
                )}
                <div className="row">
                  <div className="col-1">
                    <Icon name="envelope" />
                  </div>
                  <div className="col-11">
                    <p>
                      <strong>{SITE.legalName}</strong>
                      <br />
                      <em>{SITE.tagline}</em>
                      <br />
                      Nairobi, Kenya
                    </p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-1">
                    <Icon name="comment" />
                  </div>
                  <div className="col-11">
                    <ContactForm />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="contact-stores">
                {regions.map((r) => (
                  <div key={r}>
                    <h3>{r}</h3>
                    {stores
                      .filter((s) => s.region === r)
                      .map((s) => (
                        <div className="card contact-store" key={s.id}>
                          <div className="card-body contact-store-body">
                            <h4>{s.name}</h4>
                            <address>
                              <p>
                                {s.address.map((line, i) => (
                                  <span key={i}>
                                    {line}
                                    {i < s.address.length - 1 && <br />}
                                  </span>
                                ))}
                              </p>
                            </address>
                            {s.phones[0] && (
                              <p className="mb-0">
                                Tel: <a href={`tel:${tel(s.phones[0])}`}>{s.phones[0]}</a>
                              </p>
                            )}
                            {s.email && (
                              <p className="mb-0">
                                Email: <a href={`mailto:${s.email}`}>{s.email}</a>
                              </p>
                            )}
                          </div>
                          <div className="card-footer contact-store-footer">
                            <Link className="btn btn-primary btn-sm" href={`/stores/#${s.slug}`}>
                              Branch details
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
