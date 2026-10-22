import { organizationsRepository } from "../../database/repositories/organizations.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import type { UpdateOrganizationInput } from "./organizations.schema.js";
import { getOrganizationInfo, refreshOrganizationCache } from "../../data/organizations.js";

export class OrganizationsService {
  private sanitizePublicSystemSettings(settings: Record<string, any>) {
    return {
      sessionIdleTimeoutMinutes: settings.sessionIdleTimeoutMinutes,
      passwordMinLength: settings.passwordMinLength,
      requireSpecialChar: settings.requireSpecialChar,
      allowUserRegistration: settings.allowUserRegistration,
      requireEmailVerification: settings.requireEmailVerification,
      maintenanceMode: settings.maintenanceMode,
    };
  }

  async getOrganization(isAdmin = false) {
    const info = await getOrganizationInfo();
    const raw = info.raw || (await organizationsRepository.getOrganization());
    if (!raw) {
      throw new AppError("Organization settings not initialized", 404);
    }
    if (!info.raw) {
      refreshOrganizationCache(raw);
    }
    if (isAdmin) {
      return raw;
    }
    return {
      ...raw,
      system_settings: this.sanitizePublicSystemSettings(info.systemSettings),
    };
  }

  async updateOrganization(data: UpdateOrganizationInput) {
    const updated = await organizationsRepository.updateOrganization(data);
    refreshOrganizationCache(updated);
    return updated;
  }

  async getCurrencies() {
    return await organizationsRepository.getCurrencies();
  }

  async getSystemSettings(isAdmin = false) {
    const info = await getOrganizationInfo();
    if (isAdmin) {
      return info.systemSettings;
    }
    return this.sanitizePublicSystemSettings(info.systemSettings);
  }

  async updateSystemSettings(data: Record<string, any>) {
    const current = await this.getSystemSettings();
    const merged = { ...current, ...data };
    const updated = await organizationsRepository.updateOrganization({
      system_settings: merged,
    });
    refreshOrganizationCache(updated);
    return updated.system_settings || merged;
  }
}

export const organizationsService = new OrganizationsService();
export const organizationService = organizationsService;
