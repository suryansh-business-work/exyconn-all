/**
 * One WhatsApp conversation's work, one piece at a time: a person who taps two buttons quickly
 * sends two webhooks, and the second must not read the chat before the first saved it.
 */
export { inTurn } from '../../../lib/inTurn';
