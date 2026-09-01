# Exyconn Website 🌐

Official website for Exyconn - Built with Astro, React & TailwindCSS.

[![CI Pipeline](https://github.com/exyconn/exyconn-website/actions/workflows/ci.yml/badge.svg)](https://github.com/exyconn/exyconn-website/actions/workflows/ci.yml)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup git hooks (pre-commit checks)
npm run setup:husky

# Start dev server
npm run dev
```

Open [http://localhost:4000](http://localhost:4000)

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript check |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run Vitest tests |
| `npm run setup:husky` | Setup git hooks for pre-commit checks |
| `npm run test:watch` | Run Vitest in watch mode |

## 🛠️ Tech Stack

- **Framework:** [Astro](https://astro.build/) v5
- **UI Library:** [React](https://react.dev/) v19
- **Styling:** [TailwindCSS](https://tailwindcss.com/) v4
- **Testing:** [Vitest](https://vitest.dev/) v3
- **Language:** TypeScript

## 📁 Project Structure

```
├── src/
│   ├── components/    # UI Components
│   ├── layouts/       # Page layouts
│   ├── pages/         # Routes
│   ├── data/          # Static data
│   └── styles/        # Global styles
├── tests/             # Vitest test files
├── public/            # Static assets
└── tools/             # Creative tools (Logo Maker)
```

## 📄 Pages & Live URLs

| Page | Path | Live URL |
|------|------|----------|
| **Home** | `/` | [exyconn.com](https://exyconn.com/) |
| **About Us** | `/about-us` | [exyconn.com/about-us](https://exyconn.com/about-us) |
| **Contact** | `/contact` | [exyconn.com/contact](https://exyconn.com/contact) |
| **Get a Quote** | `/get-a-quote` | [exyconn.com/get-a-quote](https://exyconn.com/get-a-quote) |
| **Our Products** | `/our-products` | [exyconn.com/our-products](https://exyconn.com/our-products) |
| **Our Services** | `/our-services` | [exyconn.com/our-services](https://exyconn.com/our-services) |
| **Our Vision** | `/our-vision` | [exyconn.com/our-vision](https://exyconn.com/our-vision) |
| **Exyconn Services** | `/exyconn-services` | [exyconn.com/exyconn-services](https://exyconn.com/exyconn-services) |
| **Tools** | `/tools` | [exyconn.com/tools](https://exyconn.com/tools) |
| **Blog** | `/blog` | [exyconn.com/blog](https://exyconn.com/blog) |
| **Case Studies** | `/case-studies` | [exyconn.com/case-studies](https://exyconn.com/case-studies) |
| **Privacy Policy** | `/privacy-policy` | [exyconn.com/privacy-policy](https://exyconn.com/privacy-policy) |
| **Cookies** | `/cookies` | [exyconn.com/cookies](https://exyconn.com/cookies) |
| **Legal** | `/legal` | [exyconn.com/legal](https://exyconn.com/legal) |
| **Grievance** | `/grievance` | [exyconn.com/grievance](https://exyconn.com/grievance) |
| **Sitemap** | `/sitemap` | [exyconn.com/sitemap](https://exyconn.com/sitemap) |
| **AI Services** | `/ai-services` | [exyconn.com/ai-services](https://exyconn.com/ai-services) |
| **404** | `/404` | [exyconn.com/404](https://exyconn.com/404) |
| **AI Platform** | `/ai` | [exyconn.com/ai](https://exyconn.com/ai) |
| **Agentic AI** | `/ai/agentic` | [exyconn.com/ai/agentic](https://exyconn.com/ai/agentic) |
| **Bot Creation** | `/ai/bot-creation` | [exyconn.com/ai/bot-creation](https://exyconn.com/ai/bot-creation) |
| **AI Workflows** | `/ai/workflows` | [exyconn.com/ai/workflows](https://exyconn.com/ai/workflows) |
| **LLMs** | `/ai/llms` | [exyconn.com/ai/llms](https://exyconn.com/ai/llms) |
| **AI Models** | `/ai/models` | [exyconn.com/ai/models](https://exyconn.com/ai/models) |
| **Custom Model Training** | `/ai/custom-model-training` | [exyconn.com/ai/custom-model-training](https://exyconn.com/ai/custom-model-training) |
| **MCP Server** | `/ai/mcp-server` | [exyconn.com/ai/mcp-server](https://exyconn.com/ai/mcp-server) |
| **Services** | `/services` | [exyconn.com/services](https://exyconn.com/services) |
| **Application Modernization** | `/services/application-modernization` | [exyconn.com/services/application-modernization](https://exyconn.com/services/application-modernization) |
| **Automation & Integration** | `/services/automation-integration` | [exyconn.com/services/automation-integration](https://exyconn.com/services/automation-integration) |
| **Data Analytics** | `/services/data-analytics` | [exyconn.com/services/data-analytics](https://exyconn.com/services/data-analytics) |
| **Digital Consulting** | `/services/digital-consulting` | [exyconn.com/services/digital-consulting](https://exyconn.com/services/digital-consulting) |
| **Enterprise Application** | `/services/enterprise-application` | [exyconn.com/services/enterprise-application](https://exyconn.com/services/enterprise-application) |
| **Maintenance** | `/services/maintenance` | [exyconn.com/services/maintenance](https://exyconn.com/services/maintenance) |
| **Mobile App Development** | `/services/mobile-application-development` | [exyconn.com/services/mobile-application-development](https://exyconn.com/services/mobile-application-development) |
| **SaaS** | `/services/software-as-a-service` | [exyconn.com/services/software-as-a-service](https://exyconn.com/services/software-as-a-service) |
| **Career** | `/career` | [exyconn.com/career](https://exyconn.com/career) |
| **Gigs** | `/career/gigs` | [exyconn.com/career/gigs](https://exyconn.com/career/gigs) |
| **Order Agents** | `/order-agents` | [exyconn.com/order-agents](https://exyconn.com/order-agents) |

## 🔄 CI/CD

**CI Pipeline (runs on every push & PR):**

- ✅ ESLint (Lint)
- ✅ Vitest (Tests)
- ✅ Astro Build

> ⚠️ **Branch Protection:** Direct pushes to `main` are not allowed. Create a feature branch and submit a Pull Request. All CI checks must pass before merging.

**Deploy:** Auto-deploys to production on push to `main`

## 🔐 Required Secrets (GitHub)

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_PORT`
- `SLACK_WEBHOOK`
# Test comment
