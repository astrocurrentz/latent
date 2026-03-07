import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

let configured = false;

export async function configureRevenueCat(apiKey: string, appUserId: string) {
  if (!Capacitor.isNativePlatform() || configured === true) {
    return;
  }

  await Purchases.configure({
    apiKey,
    appUserID: appUserId
  });
  configured = true;
}

export async function purchaseProduct(productIdentifier: string): Promise<{ transactionId: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { transactionId: crypto.randomUUID() };
  }

  const products = await Purchases.getProducts({
    productIdentifiers: [productIdentifier]
  });

  const product = products.products.find((item) => item.identifier === productIdentifier);
  if (!product) {
    throw new Error(`RevenueCat product not found: ${productIdentifier}`);
  }

  const result = await Purchases.purchaseStoreProduct({ product });
  const transactionId = result.transaction?.transactionIdentifier ?? crypto.randomUUID();

  return { transactionId };
}

export async function restoreRevenueCat() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  await Purchases.restorePurchases();
}
