import { BaseRepository } from "./base.repository.js";
import type { OrganizationEntity } from "../types.js";

export class OrganizationsRepository extends BaseRepository<OrganizationEntity> {
  async getOrganization(): Promise<OrganizationEntity | null> {
    const result = await this.query<OrganizationEntity>(
      `SELECT 
         o.*,
         json_build_object(
           'code', curr.code,
           'name', curr.name,
           'symbol', curr.symbol
         ) AS currency
       FROM organizations o
       LEFT JOIN currencies curr ON o.default_currency = curr.code
       WHERE o.id = 1 
       LIMIT 1`,
    );
    return result.rows[0] || null;
  }

  async getCurrencies(): Promise<{ code: string; name: string; symbol: string }[]> {
    const result = await this.query<{ code: string; name: string; symbol: string }>(
      `SELECT code, name, symbol FROM currencies ORDER BY (code = 'PKR') DESC, name ASC`
    );
    return result.rows;
  }

  async updateOrganization(data: Record<string, any>): Promise<OrganizationEntity> {
    // Only update fields that are provided
    const allowedFields: (keyof OrganizationEntity)[] = [
      "organization_name",
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
      const existing = await this.getOrganization();
      return existing!;
    }

    const queryStr = `UPDATE organizations SET ${updates.join(", ")} WHERE id = 1 RETURNING *`;
    await this.query<OrganizationEntity>(queryStr, values);
    return (await this.getOrganization())!;
  }
}

export const organizationsRepository = new OrganizationsRepository();
export const organizationRepository = organizationsRepository;
