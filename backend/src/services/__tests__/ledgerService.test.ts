import { computePaymentStatus, round2 } from "../ledgerService";

describe("Sale calculation logic", () => {
  test("2 x 1000 with 500 paid => 1500 pending, PARTIALLY_PAID", () => {
    const total = round2(2 * 1000);
    const paid = 500;
    const pending = round2(total - paid);
    expect(total).toBe(2000);
    expect(pending).toBe(1500);
    expect(computePaymentStatus(total, paid)).toBe("PARTIALLY_PAID");
  });

  test("full payment => PAID, 0 pending", () => {
    const total = 2000;
    const paid = 2000;
    expect(round2(total - paid)).toBe(0);
    expect(computePaymentStatus(total, paid)).toBe("PAID");
  });

  test("zero payment => PENDING", () => {
    expect(computePaymentStatus(2000, 0)).toBe("PENDING");
  });

  test("multiple payments accumulate correctly", () => {
    const total = 5000;
    let paid = 0;
    paid = round2(paid + 1000);
    paid = round2(paid + 2000);
    const pending = round2(total - paid);
    expect(paid).toBe(3000);
    expect(pending).toBe(2000);
    expect(computePaymentStatus(total, paid)).toBe("PARTIALLY_PAID");
  });
});
