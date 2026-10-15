/**
 * Column headings other tools write for a built-in property, already normalised (lowercase,
 * letters and digits only). A synonym is used only when the record type has that property and
 * no property's own label or key matched the heading first.
 */
export const HEADER_SYNONYMS: Readonly<Record<string, string>> = {
  email: 'email',
  emailaddress: 'email',
  mail: 'email',
  company: 'companyName',
  companyname: 'companyName',
  organisation: 'companyName',
  organization: 'companyName',
  account: 'companyName',
  website: 'domain',
  websiteurl: 'domain',
  url: 'domain',
  domain: 'domain',
  fullname: 'name',
  contactname: 'name',
  leadname: 'name',
  jobtitle: 'title',
  position: 'title',
  designation: 'title',
  phonenumber: 'phone',
  mobile: 'phone',
  mobilenumber: 'phone',
  telephone: 'phone',
  city: 'location',
  note: 'notes',
  comments: 'notes',
};
