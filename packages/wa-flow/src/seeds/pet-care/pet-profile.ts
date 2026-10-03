/**
 * Pet profile: species → name → breed (list per species, or typed) → date of birth → weight →
 * gender and neutering → health notes read by `ai` (allergies, diet, temperament) → a pet ID
 * card with a QR → book a vet, a groom, or go back to the menu.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { CAT_BREEDS, DOG_BREEDS, slugOf } from './data';

const DOB = 'dob';
const OTHER_BREED = 'breed-input';
const NOTES_OK = 'notes-ok';

/** Breed list for one species, with a "mixed / other" row that asks for it in words. */
function breedList(key: string, label: string, breeds: readonly string[]): AuthorNode {
  return {
    id: `${key}-breed`,
    type: 'list',
    data: {
      text: 'What breed is {{petName}}? Pick the closest — Indie and mixed breeds are welcome.',
      button: 'Choose breed',
      sections: [
        {
          id: 'breeds',
          title: `${label} breeds`,
          rows: breeds.map((b) => ({ id: slugOf(b), title: b, set: { breed: b } })),
        },
        {
          id: 'more',
          title: 'Not listed',
          rows: [{ id: 'other', title: 'Mixed or other breed' }],
        },
      ],
    },
    next: { ...Object.fromEntries(breeds.map((b) => [slugOf(b), DOB])), other: OTHER_BREED },
  };
}

export const petProfile = defineWorkflow({
  key: 'pet-profile',
  name: 'Create pet profile',
  description: 'Save your pet’s details once for faster visits',
  keywords: ['profile', 'pet profile', 'register', 'new pet', 'pet id', 'add my pet'],
  nodes: [
    {
      id: 'intro',
      type: 'buttons',
      data: {
        header: 'Pet profile',
        text: 'Hi {{user.firstName}}! A profile lets our vets and groomers see your pet’s history at a glance — it takes about a minute. Who are we adding?',
        buttons: [
          { id: 'dog', title: 'A dog', set: { species: 'Dog' } },
          { id: 'cat', title: 'A cat', set: { species: 'Cat' } },
          { id: 'other', title: 'Another pet', set: { species: 'Other' } },
        ],
      },
      next: { dog: 'pet-name', cat: 'pet-name', other: 'pet-name' },
    },
    {
      id: 'pet-name',
      type: 'input',
      data: { prompt: 'What is their name?', var: 'petName', kind: 'text' },
      next: 'route',
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        cases: [
          { id: 'dog', var: 'species', op: 'eq', value: 'dog' },
          { id: 'cat', var: 'species', op: 'eq', value: 'cat' },
        ],
      },
      next: { dog: 'dog-breed', cat: 'cat-breed', else: OTHER_BREED },
    },
    breedList('dog', 'Dog', DOG_BREEDS),
    breedList('cat', 'Cat', CAT_BREEDS),
    {
      id: OTHER_BREED,
      type: 'input',
      data: {
        prompt: 'Please type the breed or kind of pet — e.g. "Lab mix" or "Rabbit".',
        var: 'breed',
        kind: 'text',
      },
      next: DOB,
    },
    {
      id: DOB,
      type: 'input',
      data: {
        prompt: "{{petName}}'s date of birth (DD/MM/YYYY)? A rough date is fine.",
        var: 'petDob',
        kind: 'date',
        past: true,
        error: 'Please type a date in the past as DD/MM/YYYY, e.g. 15/03/2022.',
      },
      next: 'weight',
    },
    {
      id: 'weight',
      type: 'input',
      data: {
        prompt: 'About how much does {{petName}} weigh, in kg? Just the number, e.g. 12.5.',
        var: 'weight',
        kind: 'number',
        error: 'Please type the weight in kg as a number, e.g. 12.5.',
      },
      next: 'gender',
    },
    {
      id: 'gender',
      type: 'buttons',
      data: {
        text: 'Is {{petName}} a boy or a girl?',
        buttons: [
          { id: 'male', title: 'Boy', set: { gender: 'Male' } },
          { id: 'female', title: 'Girl', set: { gender: 'Female' } },
        ],
      },
      next: { male: 'neutered', female: 'neutered' },
    },
    {
      id: 'neutered',
      type: 'buttons',
      data: {
        text: 'Is {{petName}} neutered or spayed?',
        buttons: [
          { id: 'yes', title: 'Yes', set: { neutered: 'Yes' } },
          { id: 'no', title: 'No', set: { neutered: 'No' } },
          { id: 'unsure', title: 'Not sure', set: { neutered: 'Not sure' } },
        ],
      },
      next: { yes: 'notes', no: 'notes', unsure: 'notes' },
    },
    {
      id: 'notes',
      type: 'ai',
      data: {
        note: 'Defaults first; the AI overwrites only the entities it finds.',
        set: { allergies: 'None known', temperament: 'Not noted', diet: 'Not noted' },
        prompt:
          'Last one: anything we should know? Allergies, food, medicines or temperament — e.g. "allergic to chicken, gets nervous with other dogs". Type *none* if nothing.',
        intents: [
          { id: 'health', description: 'Allergies, medicines, a condition or past surgery' },
          { id: 'behaviour', description: 'Temperament: nervous, aggressive, friendly, bites' },
          { id: 'diet', description: 'Food, diet or feeding routine' },
          { id: 'none', description: 'Nothing to add' },
        ],
        entities: [
          { name: 'allergies', kind: 'text', description: 'Allergies mentioned, if any' },
          { name: 'temperament', kind: 'text', description: 'Temperament in a few words' },
          { name: 'diet', kind: 'text', description: 'Food or diet mentioned' },
        ],
        retry: 'Thanks — I will save that as a note for the vet.',
      },
      next: {
        health: NOTES_OK,
        behaviour: NOTES_OK,
        diet: NOTES_OK,
        none: 'notes-none',
        fallback: 'notes-none',
      },
    },
    {
      id: NOTES_OK,
      type: 'text',
      data: { text: 'Thanks, noted for the care team.' },
      next: 'card',
    },
    {
      id: 'notes-none',
      type: 'text',
      data: { text: 'No problem — you can add notes any time.' },
      next: 'card',
    },
    {
      id: 'card',
      type: 'ticket',
      data: {
        set: { petId: '$id:PET' },
        complete: true,
        ticket: {
          ticketId: '{{petId}}',
          title: '{{petName}} — PawPal ID',
          subtitle: '{{species}} · {{breed}}',
          fields: [
            { label: 'Parent', value: '{{user.fullName}}' },
            { label: 'Born', value: '{{petDob}}' },
            { label: 'Weight', value: '{{weight}} kg' },
            { label: 'Gender', value: '{{gender}}' },
            { label: 'Neutered', value: '{{neutered}}' },
            { label: 'Allergies', value: '{{allergies}}' },
            { label: 'Temperament', value: '{{temperament}}' },
            { label: 'Diet', value: '{{diet}}' },
          ],
          qrData: 'pawpal://pet/{{petId}}',
        },
        caption:
          "{{petName}}'s profile is saved. Add this QR to the collar tag — anyone who finds {{petName}} can scan it to reach you.",
      },
      next: 'next-step',
    },
    {
      id: 'next-step',
      type: 'buttons',
      data: {
        text: 'What would you like to do next for {{petName}}?',
        buttons: [
          { id: 'vet', title: 'Book a vet' },
          { id: 'groom', title: 'Book grooming' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { vet: 'to-vet', groom: 'to-groom', menu: 'menu-end' },
    },
    { id: 'to-vet', type: 'jump', data: { workflowKey: 'vet-appointment' } },
    { id: 'to-groom', type: 'jump', data: { workflowKey: 'grooming' } },
    { id: 'menu-end', type: 'end', data: { showMenu: true } },
  ],
});
