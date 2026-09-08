import { gql } from 'graphql-tag';

/**
 * Localization. Everything here is readable without signing in: the login screen is the
 * first thing anybody sees and has to be in their language too.
 */
export const i18nTypeDefs = gql`
  "One UI string and what it reads as in a locale."
  type Translation {
    "SHA-256 of the source string — the key the client looks a string up by."
    key: String!
    "The English string exactly as it appears in the UI."
    source: String!
    "What is shown in place of it."
    text: String!
  }

  "A locale a workspace offers, named in its own language."
  type LocaleOption {
    "Canonical BCP-47 tag, e.g. hi, pt-BR."
    tag: String!
    "What the language calls itself — 'Deutsch', not 'German'."
    label: String!
    "Which way the script runs: ltr or rtl."
    direction: String!
  }

  "Everything a client needs to render itself in one locale."
  type LocaleBundle {
    locale: String!
    direction: String!
    "The locale untranslated strings fall back to — the workspace default."
    fallbackLocale: String!
    translations: [Translation!]!
  }

  "One page of the admin's translation review screen."
  type TranslationPage {
    rows: [TranslationRow!]!
    total: Int!
  }

  type TranslationRow {
    id: ID!
    locale: String!
    key: String!
    source: String!
    text: String!
    "AUTO for a machine translation, HUMAN once somebody has corrected it."
    kind: String!
    model: String!
    updatedAt: DateTime!
  }

  extend type Query {
    "The locales this workspace offers. Public — the login screen has a language picker."
    localeOptions: [LocaleOption!]!
    """
    Every translation for one locale, for the client to cache. Public for the same reason.
    Empty for the workspace's own default locale: there the source strings ARE the text.
    """
    localeBundle(locale: String!): LocaleBundle!
    "The admin's review screen: what has been translated, and by what. ADMIN only."
    translations(locale: String!, search: String, skip: Int, limit: Int): TranslationPage!
  }

  extend type Mutation {
    """
    Machine-translates strings this locale has never seen and returns what it managed.

    Called by any client that rendered a string with no translation, so it is safe to call
    constantly: strings already stored are skipped, a human correction is never overwritten,
    and a workspace with auto-translation off gets an empty answer rather than an error.
    """
    translateMissing(locale: String!, sources: [String!]!): [Translation!]!
    "Corrects one translation by hand. ADMIN only, and marks the row HUMAN for good."
    setTranslation(locale: String!, source: String!, text: String!): Translation!
  }
`;
