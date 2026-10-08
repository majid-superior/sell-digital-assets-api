import { organizationsRepository } from "../../database/repositories/organizations.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import type { UpdateOrganizationInput } from "./organizations.schema.js";
import { getOrganizationInfo, refreshOrganizationCache } from "../../data/organizations.js";

export class OrganizationsService {
  async getOrganization() {
    const info = await getOrganizationInfo();
    if (info.raw) {
      return info.raw;
    }
    const organization = await organizationsRepository.getOrganization();
    if (!organization) {
      throw new AppError("Organization settings not initialized", 404);
    }
    refreshOrganizationCache(organization);
    return organization;
  }

  async updateOrganization(data: UpdateOrganizationInput) {
    const updated = await organizationsRepository.updateOrganization(data);
    refreshOrganizationCache(updated);
    return updated;
  }

  async getCurrencies() {
    return await organizationsRepository.getCurrencies();
  }
}

export const organizationsService = new OrganizationsService();
export const organizationService = organizationsService;
