import { normalizePrice } from "./format";

test("normalizes plan price fields from either backend shape", () => {
  expect(normalizePrice({ price: 25 })).toBe(25);
  expect(normalizePrice({ amount: 30 })).toBe(30);
  expect(normalizePrice({})).toBe(0);
});
