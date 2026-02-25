
export interface BookSource {
  title: string;
  uri: string;
}

export interface BookRecord {
  id: string; // Mã sách (Accession Number)
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number | '';
  edition: string;
  language: string;
  pages: number | '';
  summary: string;
  summarySources?: BookSource[];
  pdfLink: string;
  coverImageUrl: string;
  
  // System fields
  ocrSource: string;
  aiConfidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface OCRResult {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  year?: number;
  edition?: string;
  pages?: number;
  language?: string;
  summary?: string;
  summarySources?: BookSource[];
  confidence: number;
}

export enum AppView {
  USER = 'USER',
  ENTRY = 'ENTRY',
  SEARCH = 'SEARCH',
  CHAT = 'CHAT',
  TRAINING = 'TRAINING', // Added Training view
  // Internal views
  LIST = 'LIST',
  FORM = 'FORM',
  DETAIL = 'DETAIL'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  GUEST = 'GUEST'
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  TEXTAREA = 'textarea',
  CHECKBOX = 'checkbox'
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormSchema {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}
