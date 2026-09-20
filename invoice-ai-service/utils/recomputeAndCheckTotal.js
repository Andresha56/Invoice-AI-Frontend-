function recomputeAndCheckTotal(invoice) {
  const computedSubtotal = invoice.lineItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const tolerance = 0.01;
  const totalsMatch =
    Math.abs(computedSubtotal - invoice.grandTotal) <= tolerance;

  return { computedSubtotal, totalsMatch };
}