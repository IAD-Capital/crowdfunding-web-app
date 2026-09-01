export const AUTH_BRAND_GRADIENT = "#1F4458";
export const AUTH_CARD_MOBILE_RADIUS = "24px 24px 0 0";
export const AUTH_CARD_MOBILE_SHADOW = "0 8px 24px rgba(0,0,0,0.18)";

export function authMobileStyle(prefix: string) {
  return `
    @media (max-width: 900px) {
      .${prefix}-wrap {
        position: relative !important;
        height: auto !important;
        min-height: 100vh !important;
        flex-direction: column-reverse !important;
        overflow: visible !important;
        background: ${AUTH_BRAND_GRADIENT} !important;
      }
      .${prefix}-right {
        display: flex !important;
        flex: 1 1 auto !important;
        min-height: 200px !important;
        background: transparent !important;
      }
      .${prefix}-right-content {
        padding: 2rem 1.5rem 1.5rem !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
      }
      .${prefix}-right-logo {
        height: 108px !important;
      }
      .${prefix}-left {
        flex: 0 0 auto !important;
        padding: 0 !important;
        align-items: stretch !important;
        justify-content: flex-end !important;
      }
      .${prefix}-form-card {
        background: #fff !important;
        border-radius: ${AUTH_CARD_MOBILE_RADIUS} !important;
        padding: 2rem 1.5rem 2.25rem !important;
        box-shadow: ${AUTH_CARD_MOBILE_SHADOW} !important;
      }
    }
  `;
}
