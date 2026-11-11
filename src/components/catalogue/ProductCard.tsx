import Link from "next/link";
import Icon from "@/components/Icon";
import { discountPercent, kes, srcSet, truncateWords } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalogue";

export function Availability({ inStock }: { inStock: boolean }) {
  return inStock ? (
    <div className="stockrecord-availability stockrecord-availability--in-stock"></div>
  ) : (
    <div className="stockrecord-availability outofstock">Out of stock</div>
  );
}

export function Prices({ price, oldPrice }: { price: number; oldPrice?: number | null }) {
  return (
    <div className="stockrecord-prices">
      <span className="stockrecord-price-current">{kes(price)}</span>
      {oldPrice && oldPrice > price ? <span className="stockrecord-price-old">{kes(oldPrice)}</span> : null}
    </div>
  );
}

/** Grid card used on the home page carousels and "You may also like". */
export function ProductCard({ product }: { product: ProductCardData }) {
  const off = discountPercent(product.price, product.oldPrice);
  return (
    <div className="card product-card">
      {off > 0 && <div className="product-ribbon-sale">{off}% Off</div>}
      <Link href={`/catalogue/${product.slug}/`}>
        <div className="product-card-img-container">
          <img
            alt={product.name}
            className="img-fluid card-img-top product-card-img"
            loading="lazy"
            src={product.cardImage ?? undefined}
            srcSet={srcSet(product.cardImage)}
          />
        </div>
        <div className="card-body product-card-body">
          <h5 className="card-title product-card-name">{truncateWords(product.name)}</h5>
          <Availability inStock={product.inStock} />
          <Prices price={product.price} oldPrice={product.oldPrice} />
        </div>
      </Link>
    </div>
  );
}

/** Wide row card used on category / search listings. */
export function ProductWideCard({ product }: { product: ProductCardData }) {
  return (
    <div className="product-wide">
      <div className="card product-wide-card">
        <Link href={`/catalogue/${product.slug}/`}>
          <div className="card-body product-wide-card__body">
            <div className="row">
              <div className="col-4 product-wide-card__img-wrapper">
                <img
                  className="img-fluid product-wide-card__img"
                  src={product.cardImage ?? undefined}
                  srcSet={srcSet(product.cardImage)}
                  alt={product.name}
                />
              </div>
              <div className="col-lg-6 col-8">
                <h3 className="card-title product-wide-card__name">{truncateWords(product.name)}</h3>
                <p className="product-wide-card__upc">Product code: {product.sku}</p>
                <Availability inStock={product.inStock} />
                <Prices price={product.price} oldPrice={product.oldPrice} />
                <div className="usp-list usp-list--vertical">
                  <div className="usp__container">
                    <Icon name="check" /> Genuine parts
                  </div>
                </div>
              </div>
              <div className="col-lg-2 d-none d-lg-block">
                {product.manufacturer?.logo && (
                  <img
                    className="img-fluid"
                    src={product.manufacturer.logo}
                    srcSet={srcSet(product.manufacturer.logo)}
                    alt=""
                  />
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
