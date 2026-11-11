import Link from "next/link";
import Icon from "@/components/Icon";

export default function UspList({ variant = "home" }: { variant?: "home" | "product" }) {
  const items =
    variant === "home"
      ? [
          { icon: "usp-delivery", label: "Delivery & Pickup", href: "/delivery-pickup/" },
          { icon: "usp-collect", label: "Click & Collect" },
          { icon: "usp-returns", label: "14 day returns", href: "/terms-and-conditions/" },
          { icon: "usp-parts", label: "Genuine parts" },
        ]
      : [
          { icon: "usp-parts", label: "Genuine parts" },
          { icon: "usp-returns", label: "14 day returns", href: "/terms-and-conditions/" },
          { icon: "usp-collect", label: "Click & collect" },
          { icon: "usp-delivery", label: "Terms & Conditions", href: "/terms-and-conditions/" },
        ];
  const col = variant === "home" ? "col-6 col-md-3" : "col-6 col-md-12";
  return (
    <div className="usp-list row">
      {items.map((u) => (
        <div className={`usp-list__item ${col}`} key={u.label}>
          {u.href ? (
            <Link className="usp__container" href={u.href}>
              <Icon name={u.icon} /> {u.label}
            </Link>
          ) : (
            <a className="usp__container">
              <Icon name={u.icon} /> {u.label}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
