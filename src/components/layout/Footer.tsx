import Link from "next/link";
import Icon from "@/components/Icon";
import { SITE } from "@/lib/site";
import WhatsappCta from "./WhatsappCta";

export default function Footer() {
  const socials = Object.entries(SITE.social).filter((e): e is [string, string] => !!e[1]);
  const col = socials.length ? "col-lg-3" : "col-lg-4";
  return (
    <footer className="page-footer">
      <div className="container">
        <div className="row">
          <div className={col}>
            <section className="page-footer-section">
              <h3>Customer Service</h3>
              <ul className="link-menu link-menu-footer_first">
                <li>
                  <Link href="/contact/">Contact</Link>
                </li>
                <li>
                  <Link href="/stores/">Stores</Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions/">Terms &amp; Conditions</Link>
                </li>
                <li>
                  <Link href="/delivery-pickup/">Delivery &amp; Pickup</Link>
                </li>
                <li>
                  <Link href="/privacy-policy/">Privacy Policy</Link>
                </li>
              </ul>
            </section>
          </div>
          <div className={col}>
            <section className="page-footer-section">
              <h3>About us</h3>
              <ul className="link-menu link-menu-footer_second">
                <li>
                  <Link href="/about/">About Us</Link>
                </li>
              </ul>
            </section>
          </div>
          <div className={col}>
            <section className="page-footer-section">
              <h3>Quick Contacts</h3>
              <ul className="link-menu link-menu-contacts">
                <li>
                  <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
                </li>
                {SITE.email && (
                  <li>
                    <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                  </li>
                )}
              </ul>
            </section>
          </div>
          {socials.length > 0 && (
            <div className="col-lg-3">
              <section className="page-footer-section">
                <h3>Social Media</h3>
                <ul className="page-social">
                  {socials.map(([k, href]) => (
                    <li className={`page-social__item ${k}`} key={k}>
                      <a href={href} target="_blank" rel="noreferrer">
                        <Icon name={k} />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
        <p className="page-footer-copyright">
          © {new Date().getFullYear()} {SITE.legalName}.
        </p>
      </div>
      <WhatsappCta />
    </footer>
  );
}
