import { TemplatePreset } from "./types.js";
import { agricultureTemplate } from "./agriculture.js";
import { ecommerceTemplate } from "./ecommerce.js";
import { businessSupportTemplate } from "./business_support.js";
import { techHelpdeskTemplate } from "./tech_helpdesk.js";
import { healthcareTemplate } from "./healthcare.js";
import { financeTemplate } from "./finance.js";
import { educationTemplate } from "./education.js";
import { hrTemplate } from "./hr.js";
import { travelTemplate } from "./travel.js";
import { realEstateTemplate } from "./real_estate.js";
import { governmentTemplate } from "./government.js";
import { creativeTemplate } from "./creative.js";

export * from "./types.js";
export * from "./agriculture.js";
export * from "./ecommerce.js";
export * from "./business_support.js";
export * from "./tech_helpdesk.js";
export * from "./healthcare.js";
export * from "./finance.js";
export * from "./education.js";
export * from "./hr.js";
export * from "./travel.js";
export * from "./real_estate.js";
export * from "./government.js";
export * from "./creative.js";

export const ALL_TEMPLATES: TemplatePreset[] = [
  agricultureTemplate,
  ecommerceTemplate,
  businessSupportTemplate,
  techHelpdeskTemplate,
  healthcareTemplate,
  financeTemplate,
  educationTemplate,
  hrTemplate,
  travelTemplate,
  realEstateTemplate,
  governmentTemplate,
  creativeTemplate,
];

export function getAllTemplates(): TemplatePreset[] {
  return ALL_TEMPLATES;
}

export function getTemplateBySlug(slug: string): TemplatePreset | undefined {
  return ALL_TEMPLATES.find((t) => t.slug === slug);
}

export function getTemplateById(id: string): TemplatePreset | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}
