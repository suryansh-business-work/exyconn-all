import gql from 'graphql-tag';

export const jobCompanyTypeDefs = gql`
  type CompanyBenefit {
    icon: String!
    title: String!
    description: String!
  }

  input CompanyBenefitInput {
    icon: String!
    title: String!
    description: String
  }

  type CompanySocialLinks {
    linkedin: String!
    twitter: String!
    facebook: String!
    instagram: String!
  }

  input CompanySocialLinksInput {
    linkedin: String
    twitter: String
    facebook: String
    instagram: String
  }

  type JobCompany {
    id: ID!
    companyCode: String!
    slug: String!
    name: String!
    logo: String!
    tagline: String!
    description: String!
    culture: String!
    website: String!
    founded: String!
    employees: String!
    industry: String!
    headquarters: String!
    benefits: [CompanyBenefit!]!
    socialLinks: CompanySocialLinks!
    brandColor: String!
    secondaryColor: String!
    isActive: Boolean!
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input JobCompanyInput {
    companyCode: String!
    slug: String!
    name: String!
    logo: String
    tagline: String
    description: String
    culture: String
    website: String
    founded: String
    employees: String
    industry: String
    headquarters: String
    benefits: [CompanyBenefitInput!]
    socialLinks: CompanySocialLinksInput
    brandColor: String
    secondaryColor: String
    isActive: Boolean
    order: Int
  }

  type JobCompanyPage {
    rows: [JobCompany!]!
    totalCount: Int!
  }

  extend type Query {
    listJobCompanies: [JobCompany!]!
    listJobCompaniesPaged(input: TableQueryInput!): JobCompanyPage!
    listJobCompaniesStats: TableStats!
    getJobCompany(id: ID!): JobCompany!
    publicJobCompanies: [JobCompany!]!
    publicJobCompany(slug: String!): JobCompany
  }

  extend type Mutation {
    createJobCompany(input: JobCompanyInput!): JobCompany!
    updateJobCompany(id: ID!, input: JobCompanyInput!): JobCompany!
    deleteJobCompany(id: ID!): Boolean!
  }
`;
