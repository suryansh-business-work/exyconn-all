/** Sign-in, FAQs, threads and the composer. Colours: --cw-* only. */
export const contentCss = `
.cw-signin, .cw-faqs { overflow-y: auto; padding: 16px; }
.cw-form { display: flex; flex-direction: column; gap: 12px; }
.cw-form-title { margin: 0; font-size: 16px; }
.cw-field { display: flex; flex-direction: column; gap: 4px; }
.cw-field label { font-weight: 600; font-size: 13px; }
.cw-input, .cw-textarea {
  width: 100%; padding: 10px 12px; font: inherit; color: var(--cw-text);
  background: var(--cw-surface); border: 1px solid var(--cw-text-muted); border-radius: var(--cw-radius-control);
}
.cw-input::placeholder, .cw-textarea::placeholder { color: var(--cw-text-muted); }
.cw-input[aria-invalid='true'] { border-color: var(--cw-danger); border-width: 2px; }
.cw-field-error { margin: 0; font-size: 12px; font-weight: 600; color: var(--cw-text); }
.cw-field-error::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; background: var(--cw-danger); }

.cw-search { position: relative; margin-bottom: 12px; }
.cw-search .cw-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--cw-text-muted); }
.cw-search .cw-input { padding-left: 38px; }
.cw-faq-list { display: flex; flex-direction: column; gap: 8px; }
.cw-faq { border: 1px solid var(--cw-border); border-radius: var(--cw-radius-control); background: var(--cw-surface); }
.cw-faq summary {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 12px; font-weight: 600; cursor: pointer; list-style: none;
}
.cw-faq summary::-webkit-details-marker { display: none; }
.cw-faq summary .cw-icon { transition: transform 0.2s ease; }
.cw-faq[open] summary .cw-icon { transform: rotate(180deg); }
.cw-faq p { margin: 0; padding: 0 12px 12px; color: var(--cw-text-muted); white-space: pre-wrap; }
.cw-help { margin-top: 16px; padding: 16px; text-align: center; border-radius: var(--cw-radius-control); background: var(--cw-surface-muted); }
.cw-help p { margin: 0 0 8px; font-weight: 600; }

.cw-chat { display: flex; flex-direction: column; }
.cw-thread { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.cw-welcome { margin: auto 0 0; padding: 12px 14px; border-radius: var(--cw-radius-bubble); background: var(--cw-agent-bubble); color: var(--cw-on-agent-bubble); white-space: pre-wrap; }
.cw-row { display: flex; flex-direction: column; max-width: 85%; }
.cw-from-visitor { align-self: flex-end; align-items: flex-end; }
.cw-from-team { align-self: flex-start; align-items: flex-start; }
.cw-from-system { align-self: center; max-width: 92%; }
.cw-new { animation: cw-slide-in 0.25s ease-out; }
.cw-from-visitor.cw-new { animation-name: cw-slide-in-right; }
@keyframes cw-slide-in { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
@keyframes cw-slide-in-right { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
.cw-sender { margin: 0 0 2px 4px; font-size: 12px; font-weight: 600; color: var(--cw-text-muted); }
.cw-bubble { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: var(--cw-radius-bubble); overflow-wrap: anywhere; }
.cw-from-visitor .cw-bubble { background: var(--cw-visitor-bubble); color: var(--cw-on-visitor-bubble); border-bottom-right-radius: 4px; }
.cw-from-team .cw-bubble { background: var(--cw-agent-bubble); color: var(--cw-on-agent-bubble); border-bottom-left-radius: 4px; }
.cw-body { margin: 0; white-space: pre-wrap; }
.cw-system { margin: 0; padding: 6px 12px; font-size: 12px; text-align: center; color: var(--cw-text-muted); background: var(--cw-surface-muted); border-radius: var(--cw-radius-control); }
.cw-media { display: block; max-width: 100%; max-height: 220px; border-radius: calc(var(--cw-radius-bubble) - 6px); }
.cw-bubble audio { max-width: 240px; }
.cw-meta { margin: 2px 4px 0; font-size: 11px; color: var(--cw-text-muted); display: flex; align-items: center; gap: 6px; }
.cw-failed { color: var(--cw-text); font-weight: 600; }
.cw-retry { display: inline-flex; align-items: center; gap: 2px; padding: 2px 6px; border: 1px solid var(--cw-border); border-radius: var(--cw-radius-control); background: var(--cw-surface); color: var(--cw-primary); font-size: 11px; }
.cw-retry .cw-icon { width: 14px; height: 14px; }
.cw-seen { align-self: flex-end; margin: -6px 4px 0; font-size: 11px; color: var(--cw-text-muted); }
.cw-typing { align-self: flex-start; display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--cw-text-muted); }
.cw-dots { display: inline-flex; gap: 3px; padding: 8px 10px; border-radius: var(--cw-radius-bubble); background: var(--cw-agent-bubble); }
.cw-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--cw-text-muted); animation: cw-blink 1.2s infinite ease-in-out; }
.cw-dots i:nth-child(2) { animation-delay: 0.15s; }
.cw-dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes cw-blink { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

.cw-composer { flex: none; padding: 10px 12px; border-top: 1px solid var(--cw-border); background: var(--cw-surface); }
.cw-compose-row { display: flex; align-items: flex-end; gap: 6px; }
.cw-extras { display: flex; }
.cw-textarea { flex: 1; resize: none; max-height: 140px; line-height: 1.4; }
.cw-send { width: 40px; height: 40px; flex: none; border: 0; border-radius: var(--cw-radius-control); display: grid; place-items: center; background: var(--cw-primary); color: var(--cw-on-primary); }
.cw-counter { margin: 4px 0 0; font-size: 11px; text-align: right; color: var(--cw-text-muted); }
.cw-previews { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.cw-previews.cw-off { display: none; }
.cw-preview { position: relative; }
.cw-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: var(--cw-radius-control); border: 1px solid var(--cw-border); }
.cw-thumb-remove { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; display: grid; place-items: center; background: var(--cw-text); color: var(--cw-surface); }
.cw-thumb-remove .cw-icon { width: 14px; height: 14px; }
.cw-recording { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 6px 8px; border-radius: var(--cw-radius-control); background: var(--cw-surface-muted); }
.cw-rec-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--cw-danger); animation: cw-blink 1s infinite; }
.cw-timer { flex: 1; font-variant-numeric: tabular-nums; }
.cw-ended { flex: none; display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--cw-border); }
.cw-ended p { margin: 0; font-weight: 600; text-align: center; }
.cw-ended .cw-row-actions { justify-content: center; }
`;
