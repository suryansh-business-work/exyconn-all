import gql from 'graphql-tag';

/** Files on CRM activities (see crm.media.ts). */
export const crmMediaTypeDefs = gql`
  extend type Activity {
    "Photos, documents and call or meeting recordings."
    attachments: [FileAttachment!]!
    "How long a call or meeting lasted, in seconds, when logged."
    durationSeconds: Int
  }

  extend input ActivityInput {
    attachments: [FileAttachmentInput!]
    durationSeconds: Int
  }

  extend type Mutation {
    "Uploads a photo, PDF or audio / video recording (10 MB at most) and returns its URL."
    uploadCrmMedia(file: String!, fileName: String!): String!
  }
`;
