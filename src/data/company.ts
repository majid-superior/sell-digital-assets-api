import companyData from "./company.json" with { type: "json" };

export interface CompanyLogo {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface CompanyFavicon {
  url: string;
  type: string;
}

export interface CompanyContact {
  email: string;
  phone: string;
  supportUrl: string;
}

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formatted: string;
}

export interface CompanyLinks {
  website: string;
  docs: string;
  status: string;
  github: string;
}

export interface CompanyCopyright {
  year: number;
  holder: string;
  text: string;
}

export interface CompanyInfo {
  name: string;
  shortName: string;
  title: string;
  tagline: string;
  description: string;
  logo: CompanyLogo;
  favicon: CompanyFavicon;
  contact: CompanyContact;
  address: CompanyAddress;
  links: CompanyLinks;
  copyright: CompanyCopyright;
}

export const company: CompanyInfo = companyData as CompanyInfo;
export default company;
