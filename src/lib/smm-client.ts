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
}

export class SmmClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.trim();
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
        timeout: 15000,
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
    return [];
  }

  /**
   * Check balance on the provider account
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    const data = await this.post({ action: "balance" });
    if (data?.error) {
      throw new Error(data.error);
    }
    const balance = parseFloat(data?.balance ?? 0);
    const currency = data?.currency ?? "USD";
    return { balance: isNaN(balance) ? 0 : balance, currency };
  }

  /**
   * Submit a new order
   */
  async addOrder(params: SmmAddOrderParams): Promise<{ order: string }> {
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
      throw new Error(data.error);
    }
    if (!data?.order) {
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
    return data;
  }
}
