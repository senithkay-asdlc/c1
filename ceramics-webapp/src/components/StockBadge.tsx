type Props = {
  stockQty: number;
  lowStock?: boolean;
};

export function StockBadge({ stockQty, lowStock }: Props) {
  if (stockQty <= 0) {
    return <span className="badge badge-danger">Out of stock</span>;
  }
  if (lowStock) {
    return <span className="badge badge-warning">Low stock — {stockQty} left</span>;
  }
  return <span className="badge badge-success">{stockQty} in stock</span>;
}
