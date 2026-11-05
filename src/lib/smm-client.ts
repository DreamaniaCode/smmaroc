import axios from "axios";

export interface SmmServiceItem {
  service: string | number;
  name: string;
  type?: string;
  category?: string;
  rate?: string | number;
  min?: string | number;
  max?: string | number;
  refill?: boolean;
  cancel?: boolean;
}

export interface SmmOrderStatus {
  charge?: string | number;
  start_count?: string | number;
  status: "Pending" | "In progress" | "Completed" | "Partial" | "Canceled" | "Processing" | string;
  remains?: string | number;
  currency?: string;
  error?: string;
}

export interface SmmAddOrderParams {
  service: string | number;
  link: string;
  quantity: number;
  runs?: number;
  interval?: number;
  comments?: string;
  ratePer1000?: number;
}

export class SupplierBalanceError extends Error {}
export class OrderNotSubmittedError extends Error {}

export function normalizeProviderUrl(value: string) {
 const url = new URL(value.trim());
 if (["justanotherpanel.com", "www.justanotherpanel.com"].includes(url.hostname) && /^\/api\/?$/.test(url.pathname)) url.pathname = "/api/v2";
 return url.toString();
}

export class SmmClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = normalizeProviderUrl(apiUrl);
    this.apiKey = apiKey.trim();
  }

  private async post(params: Record<string, any>) {
    const formData = new URLSearchParams();
    formData.append("key", this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    }

    try {
      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "SMM-Agency-Panel/1.0",
        },
        timeout: 45000,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || "Provider connection error";
      throw new Error(`SMM API Error (${this.apiUrl}): ${message}`);
    }
  }

  /**
   * Fetch services catalog from the provider
   */
  async getServices(): Promise<SmmServiceItem[]> {
    const data = await this.post({ action: "services" });
    if (Array.isArray(data)) {
      return data;
    }
    if (data?.error) {
      throw new Error(data.error);
    }
    if (Array.isArray(data?.services)) return data.services;
    throw new Error("Réponse catalogue invalide reçue du fournisseur");
  }

  /**
   * Check balance on the provider account
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    const data = await this.post({ action: "balance" });
    if (data?.error) {
      throw new Error(data.error);
    }
    const raw = data?.balance;
    const balance = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? Number(raw) : NaN;
    if (!Number.isFinite(balance) || balance < 0 || typeof data?.currency !== "string" || !data.currency.trim()) {
      throw new Error("Réponse de solde invalide. Vérifiez l’URL API et la clé du fournisseur.");
    }
    return { balance, currency: data.currency.trim() };
  }

  /**
   * Submit a new order
   */
  async addOrder(params: SmmAddOrderParams): Promise<{ order: string }> {
    let balance:number,rate:number;
    try {
    ({ balance } = await this.getBalance());
    if (balance <= 0) throw new SupplierBalanceError("Solde fournisseur insuffisant. Commande en attente de recharge.");
    rate = params.ratePer1000 ?? Number((await this.getServices()).find(s => String(s.service) === String(params.service))?.rate);
    if (!Number.isFinite(rate) || rate < 0) throw new Error("Tarif fournisseur indisponible. Commande non envoyée.");
    const supplierCost = rate * params.quantity / 1000 * (params.runs && params.runs > 1 ? params.runs : 1);
    if (balance < supplierCost) throw new SupplierBalanceError("Solde fournisseur insuffisant. Commande en attente de recharge.");
    } catch(error) {if(error instanceof SupplierBalanceError)throw error;throw new OrderNotSubmittedError(error instanceof Error?error.message:"Vérification fournisseur impossible");}
    const payload: Record<string, any> = {
      action: "add",
      service: params.service,
      link: params.link,
      quantity: params.quantity,
    };

    if (params.runs && params.runs > 1) {
      payload.runs = params.runs;
      payload.interval = params.interval || 60;
    }

    if (params.comments) {
      payload.comments = params.comments;
    }

    const data = await this.post(payload);
    if (data?.error) {
      if (/insufficient.*(balance|fund)|not enough.*(balance|fund)|balance.*insufficient/i.test(String(data.error))) throw new SupplierBalanceError(String(data.error));
      throw new OrderNotSubmittedError(String(data.error));
    }
    if (!data?.order || !/^[1-9]\d*$/.test(String(data.order))) {
      throw new Error("No order ID returned from provider");
    }
    return { order: String(data.order) };
  }

  /**
   * Check status of a single order
   */
  async getStatus(orderId: string): Promise<SmmOrderStatus> {
    const data = await this.post({ action: "status", order: orderId });
    if (data?.error) {
      return { status: "Error", error: data.error };
    }
    return data as SmmOrderStatus;
  }

  /**
   * Check status of multiple orders at once
   */
  async getMultiStatus(orderIds: string[]): Promise<Record<string, SmmOrderStatus>> {
    if (orderIds.length === 0) return {};
    const data = await this.post({ action: "status", orders: orderIds.join(",") });
    if (data?.error) {
      throw new Error(data.error);
    }
    return data;
  }

  /**
   * Request refill for an order
   */
  async refill(orderId: string): Promise<{ refill: string }> {
    const data = await this.post({ action: "refill", order: orderId });
    if (data?.error) {
      throw new Error(data.error);
    }
    return { refill: String(data?.refill || "ok") };
  }

  /**
   * Request order cancellation
   */
  async cancel(orderIds: string[]): Promise<any> {
    const data = await this.post({ action: "cancel", orders: orderIds.join(",") });
    if (data?.error) throw new Error(data.error);
    if (Array.isArray(data)) { const rejected = data.find((item: any) => item.error || item.cancel?.error); if (rejected) throw new Error(rejected.error || rejected.cancel.error); }
    return data;
  }
}
