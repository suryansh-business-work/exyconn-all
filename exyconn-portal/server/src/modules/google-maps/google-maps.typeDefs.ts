import gql from 'graphql-tag';

/** Google Maps keys (Tech) and the CRM lead generator built on them (see this module). */
export const googleMapsTypeDefs = gql`
  "The install's Google Maps Platform keys (Tech > Environment Variables). Both keys are write-only."
  type GoogleMapsConfig {
    id: ID!
    label: String!
    hasBrowserKey: Boolean!
    browserKeyHint: String
    hasServerKey: Boolean!
    serverKeyHint: String
    isActive: Boolean!
    updatedAt: DateTime!
  }

  input GoogleMapsConfigInput {
    label: String!
    "Maps JavaScript key, restricted to the CRM's HTTP referrers. Leave empty when editing to keep it."
    browserKey: String!
    "Places API (New) key, used by the server only. Leave empty when editing to keep it."
    serverKey: String!
    isActive: Boolean
  }

  "What the CRM's maps need: the browser key, and whether lead search is set up."
  type GoogleMapsClientConfig {
    "Null when no browser key is configured; maps are then hidden."
    browserKey: String
    placesReady: Boolean!
  }

  input LatLngInput {
    lat: Float!
    lng: Float!
  }

  "A region Google suggests for the lead generator's Where box."
  type LeadLocationSuggestion {
    placeId: ID!
    text: String!
    mainText: String!
    secondaryText: String!
  }

  input LeadSearchInput {
    "What to look for, e.g. dentists."
    query: String!
    "Where, as text (e.g. Pune, India). Ignored when lat and lng are given."
    location: String
    lat: Float
    lng: Float
    "Radius around lat/lng in metres, at most 50000."
    radiusMeters: Int
    "An area drawn on the map (3 to 50 points): only places inside it. Wins over location and lat/lng."
    polygon: [LatLngInput!]
    "A Google Places type, e.g. dentist."
    type: String
    pageToken: String
  }

  "A business found on Google Places."
  type LeadPlace {
    placeId: ID!
    name: String!
    address: String!
    city: String!
    country: String!
    phone: String!
    website: String!
    rating: Float
    ratingCount: Int
    lat: Float!
    lng: Float!
    mapUrl: String!
    types: [String!]!
    primaryType: String!
    "The CRM company already filed from this place, if any."
    existingCompanyId: ID
  }

  type LeadSearchPage {
    places: [LeadPlace!]!
    "Pass back to get the next page; null on the last one."
    nextPageToken: String
  }

  enum LeadEmailStatus {
    FOUND
    NONE
    BLOCKED
    UNREACHABLE
  }

  type LeadEmailResult {
    emails: [String!]!
    status: LeadEmailStatus!
    message: String!
  }

  input LeadImportInput {
    placeId: ID!
    name: String!
    phone: String
    website: String
    address: String
    city: String
    country: String
    lat: Float!
    lng: Float!
    mapUrl: String
    emails: [String!]
    primaryType: String
  }

  type LeadImportSkip {
    placeId: ID!
    name: String!
    reason: String!
    "The CRM company the lead duplicates, when there is one."
    companyId: ID
  }

  "What a lead would do on import."
  enum LeadImportStatus {
    "Not in the CRM yet: it will be filed."
    NEW
    "Already in the CRM with nothing new: it will be skipped."
    DUPLICATE
    "Already in the CRM, and it has details the company is missing."
    DUPLICATE_WITH_EXTRA
  }

  "One detail a lead adds to an existing company. Only ever fills an empty field or adds a new email or phone."
  type LeadImportExtra {
    "website, address, city, country, location, industry, mapUrl, placeId, coordinates, emails or phones."
    field: String!
    label: String!
    "What the company holds now; for emails and phones, the ones it already has."
    current: String!
    incoming: String!
  }

  type LeadImportPreview {
    placeId: ID!
    name: String!
    status: LeadImportStatus!
    existingCompanyId: ID
    existingName: String
    extras: [LeadImportExtra!]!
  }

  "A duplicate lead whose extra details should be added to the company the preview matched."
  input LeadMergeInput {
    placeId: ID!
    companyId: ID!
  }

  "An existing company that got a lead's extra details."
  type LeadImportMerged {
    placeId: ID!
    companyId: ID!
    name: String!
    added: [LeadImportExtra!]!
  }

  "A place filed as a CRM company."
  type LeadImportFiled {
    placeId: ID!
    companyId: ID!
  }

  type LeadImportResult {
    created: Int!
    skipped: Int!
    merged: Int!
    filed: [LeadImportFiled!]!
    merges: [LeadImportMerged!]!
    skips: [LeadImportSkip!]!
  }

  extend type Query {
    googleMapsConfigs: [GoogleMapsConfig!]!
    googleMapsClientConfig: GoogleMapsClientConfig!
    "One page (up to 20) of Google Places Text Search results."
    searchLeadPlaces(input: LeadSearchInput!): LeadSearchPage!
    "Cities, areas and postcodes matching what was typed in Where (2-100 characters)."
    leadLocationSuggestions(input: String!): [LeadLocationSuggestion!]!
    "Read-only: which of these leads are already CRM companies, and what extra details each would add."
    previewLeadImport(leads: [LeadImportInput!]!): [LeadImportPreview!]!
  }

  extend type Mutation {
    createGoogleMapsConfig(input: GoogleMapsConfigInput!): GoogleMapsConfig!
    updateGoogleMapsConfig(id: ID!, input: GoogleMapsConfigInput!): GoogleMapsConfig!
    "Runs one Places search with the server key; says what worked, or why not."
    testGoogleMapsConfig(id: ID!): String!
    deleteGoogleMapsConfig(id: ID!): Boolean!
    "Reads a business website (home and contact pages, robots.txt honoured) for its email addresses."
    findLeadEmails(website: String!): LeadEmailResult!
    "Files the chosen places as CRM companies. Duplicates are skipped, or, when listed in mergeInto, get their extra details added without overwriting anything."
    importLeadsToCrm(leads: [LeadImportInput!]!, mergeInto: [LeadMergeInput!]): LeadImportResult!
  }
`;
