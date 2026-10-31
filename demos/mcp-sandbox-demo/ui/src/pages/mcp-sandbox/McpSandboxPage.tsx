import {
  DemoCtaBand,
  DemoFaq,
  DemoFooter,
  DemoHeader,
  DemoHero,
  DemoHighlights,
  DemoSection,
  DemoSteps,
} from '@exyconn/demo-visitor/page';
import { Box } from '@exyconn/shell/components/ui';
import { ConnectSteps } from '../../components/ConnectSteps';
import { Playground } from '../../components/Playground';
import { SampleData } from '../../components/SampleData';
import { TokenPanel } from '../../components/TokenPanel';
import { FAQ, HIGHLIGHTS, TRY_STEPS } from './content';
import { useMcpSandbox } from './useMcpSandbox';

/**
 * demos.exyconn.com/mcp-sandbox-demo: take a short-lived, read-only MCP token for a sample
 * company, connect Claude to it, or list and run its tools right here.
 */
export function McpSandboxPage() {
  const sandbox = useMcpSandbox();
  const { info } = sandbox;
  const token = sandbox.issued?.token ?? null;
  return (
    <>
      <DemoHeader current="mcp-sandbox-demo" />
      <Box component="main" sx={{ minHeight: '100vh' }}>
        <DemoHero
          eyebrow="Live demo · MCP sandbox"
          title="Connect Claude to a company's CRM, projects and team"
          subtitle="Take a read-only token for a sample company and ask Claude about its pipeline, projects and people, through the same MCP server your own workspace gets."
          visual={<TokenPanel sandbox={sandbox} />}
        >
          <DemoHighlights items={HIGHLIGHTS} />
        </DemoHero>
        {info && (
          <>
            <DemoSection
              id="sample-data"
              title="What is in the sandbox"
              subtitle="Invented records, so nothing real is ever shared."
              tinted
            >
              <SampleData info={info} />
            </DemoSection>
            <DemoSection
              id="connect"
              title="Connect Claude"
              subtitle="Your token fills in below once you take one."
            >
              <ConnectSteps endpointUrl={info.endpointUrl} token={token} />
            </DemoSection>
            <DemoSection
              id="playground"
              title="Try the tools in your browser"
              subtitle="The same read-only tools Claude sees, run with your token."
              tinted
            >
              <Playground endpointUrl={info.endpointUrl} token={token} />
            </DemoSection>
          </>
        )}
        <DemoSection id="how-to-try" title="How to try it">
          <DemoSteps steps={TRY_STEPS} />
        </DemoSection>
        <DemoSection id="faq" title="Questions people ask" tinted>
          <DemoFaq items={FAQ} />
        </DemoSection>
        <DemoCtaBand
          title="Want Claude working in your own systems?"
          subtitle="We connect Claude to your CRM, projects, HR and finance through MCP, with your permissions and a full audit trail."
        />
      </Box>
      <DemoFooter />
    </>
  );
}
