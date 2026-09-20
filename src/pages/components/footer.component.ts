import { escapeHtml } from "../page.utils.js";
import { company } from "../../data/company.js";

export function renderFooter(timestamp: string | Date | number): string {
  const formattedTime = new Date(timestamp).toLocaleTimeString();

  return `
    <footer class="footer">
      <div>Checked: <span style="font-family: var(--font-mono); font-weight: 500;">${escapeHtml(formattedTime)}</span></div>
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span>${escapeHtml(company.copyright.text)}</span>
      </div>
    </footer>`;
}
