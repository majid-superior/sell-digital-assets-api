import { BaseRepository } from "./base.repository.js";
import type { CompanyEntity } from "../types.js";

export class CompanyRepository extends BaseRepository<CompanyEntity> {
  async getCompany(): Promise<CompanyEntity | null> {
    const result = await this.query<CompanyEntity>(
      "SELECT * FROM company WHERE id = 1 LIMIT 1",
    );
    return result.rows[0] || null;
  }

  async updateCompany(data: Record<string, any>): Promise<CompanyEntity> {
    // Only update fields that are provided
    const allowedFields: (keyof CompanyEntity)[] = [
      "company_name",
      "legal_name",
      "tagline",
      "description",
      "logo_url",
      "logo_dark_url",
      "favicon_url",
      "cover_banner_url",
      "support_email",
      "contact_email",
      "support_phone",
      "support_url",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "postal_code",
      "country",
      "tax_id",
      "default_currency",
      "platform_fee_percent",
      "payout_minimum",
      "social_links",
      "metadata",
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        let val = data[field];
        if (field === "social_links" || field === "metadata") {
          val = JSON.stringify(val);
        }
        updates.push(`${field} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (updates.length === 0) {
      const existing = await this.getCompany();
      return existing!;
    }

    const queryStr = `UPDATE company SET ${updates.join(", ")} WHERE id = 1 RETURNING *`;
    const result = await this.query<CompanyEntity>(queryStr, values);
    return result.rows[0]!;
  }
}

export const companyRepository = new CompanyRepository();
