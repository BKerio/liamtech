"use client";

import Icon from "@/components/Icon";
import { showToast } from "@/components/Toasts";

export default function ShareButtons({ name, image, productId }: { name: string; image?: string; productId: number }) {
  const url = () => window.location.href.split("#")[0];
  const open = (type: string) => {
    const u = encodeURIComponent(url());
    const t = encodeURIComponent(name);
    const img = encodeURIComponent(image ? new URL(image, window.location.origin).href : "");
    const target = {
      twitter: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${u}&media=${img}&description=${t}`,
    }[type];
    if (target) window.open(target, "_blank", "noopener,width=600,height=500");
  };

  const btn = (type: string, label: string) => (
    <button
      data-type={type}
      type="button"
      className={`btn btn-icon btn-outline-dark btn-${type} catalogue-social-sharing-btn`}
      onClick={() => open(type)}
    >
      <Icon name={type} />
      <span className="sr-only">{label}</span>
    </button>
  );

  return (
    <div className="product-share">
      <h4>Share this product</h4>
      <p className="catalogue-social-sharing">
        {btn("twitter", "Tweet about this product")} {btn("facebook", "Share this on Facebook")}{" "}
        {btn("whatsapp", "Share this via WhatsApp")} {btn("pinterest", "Pin this with Pinterest")}{" "}
        <a
          href={`mailto:?subject=${encodeURIComponent(name)}`}
          onClick={(e) => {
            e.currentTarget.href = `mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(url())}`;
          }}
          className="btn btn-icon btn-outline-dark btn-email catalogue-social-sharing-btn"
          data-product={productId}
        >
          <Icon name="envelope" />
          <span className="sr-only">Share by email</span>
        </a>{" "}
        <a
          className="btn btn-icon btn-outline-dark btn-clipboard catalogue-social-sharing-btn js-copy-text"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigator.clipboard?.writeText(url()).then(() => showToast("Link copied to clipboard"));
          }}
        >
          <Icon name="link" />
          <span className="sr-only">Copy page link</span>
        </a>
      </p>
    </div>
  );
}
