import { companyRepository } from "../../database/repositories/company.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import type { UpdateCompanyInput } from "./company.schema.js";

import { getCompanyInfo, refreshCompanyCache } from "../../data/company.js";

export class CompanyService {
  async getCompany() {
    const info = await getCompanyInfo();
    if (info.raw) {
      return info.raw;
    }
    const company = await companyRepository.getCompany();
    if (!company) {
      throw new AppError("Company settings not initialized", 404);
    }
    refreshCompanyCache(company);
    return company;
  }

  async updateCompany(data: UpdateCompanyInput) {
    const updated = await companyRepository.updateCompany(data);
    refreshCompanyCache(updated);
    return updated;
  }
}

export const companyService = new CompanyService();
