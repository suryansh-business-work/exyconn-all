/**
 * Public Exyconn domains that are separate deployments from this website.
 *
 * The tools catalogue lives entirely on its own app (see deploy/nginx/tools.exyconn.com.conf);
 * the website only links out to it, so the domain is declared once here.
 */
export const TOOLS_SITE_URL = "https://tools.exyconn.com";
