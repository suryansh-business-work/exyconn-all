/**
 * `@exyconn/demo-visitor` — the email-and-code sign-in every demo on demos.exyconn.com shares:
 * the visitor's pass (one per browser, for all the demos), the gate in front of a demo, and the
 * sign-in page. The server side is the portal's whatsapp-demo/visitor module.
 */
export { DemoLoginPage, type DemoLoginPageProps } from './DemoLoginPage';
export { VisitorGate } from './VisitorGate';
export { useVisitor } from './useVisitor';
export {
  clearVisitorPass,
  hasVisitorPass,
  installVisitorPass,
  storeVisitorPass,
} from './visitorPass';
