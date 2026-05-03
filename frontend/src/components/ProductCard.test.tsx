import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "./ProductCard";
import type { Product } from "../api/types";

const product: Product = {
  id: 1,
  name: "Canvas Weekender",
  description: "Durable carryall for short trips.",
  image_url: "https://example.com/weekender.jpg",
  price: 129,
  stock: 4,
  created_at: "2026-05-02T00:00:00Z",
  updated_at: "2026-05-02T00:00:00Z"
};

test("adds a product from the product card", async () => {
  const user = userEvent.setup();
  const onAdd = vi.fn();

  render(<ProductCard product={product} onAdd={onAdd} />);
  await user.click(screen.getByRole("button", { name: /add to cart/i }));

  expect(onAdd).toHaveBeenCalledWith(product);
});

test("renders the product image when one is provided", () => {
  render(<ProductCard product={product} onAdd={vi.fn()} />);

  expect(screen.getByRole("img", { name: product.name })).toHaveAttribute("src", product.image_url);
});

test("renders a placeholder when no product image is available", () => {
  render(<ProductCard product={{ ...product, image_url: null }} onAdd={vi.fn()} />);

  expect(screen.getByText("CA")).toBeInTheDocument();
  expect(screen.queryByRole("img", { name: product.name })).not.toBeInTheDocument();
});

test("disables purchases for out-of-stock products", () => {
  render(<ProductCard product={{ ...product, stock: 0 }} onAdd={vi.fn()} />);

  expect(screen.getByRole("button", { name: /sold out/i })).toBeDisabled();
});
