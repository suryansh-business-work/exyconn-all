import gql from 'graphql-tag';

/** Map position of a company or contact (see crm.geo.ts). */
export const crmGeoTypeDefs = gql`
  extend type Company {
    "Latitude, when the account was filed from Google Places; null otherwise."
    lat: Float
    "Longitude, when the account was filed from Google Places; null otherwise."
    lng: Float
    "The Google Place ID it was filed from, empty when typed in by hand."
    placeId: String!
    "Its Google Maps page, empty when unknown."
    mapUrl: String!
    "Where the account came from, e.g. Google Places; empty when typed in by hand."
    leadSource: String!
  }

  extend type Contact {
    lat: Float
    lng: Float
    placeId: String!
    mapUrl: String!
  }
`;
