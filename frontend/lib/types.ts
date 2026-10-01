// Content items are stored as a JSON blob the admin can extend, so a controlled
// index signature stays — but narrowed from `unknown` to the value shapes the
// API actually returns, which keeps field access type-checked while still
// allowing the dynamic `${key}_${locale}` lookups the UI relies on.
export type FieldValue = string | string[] | number | boolean | undefined;

export type ContentItem = {
  id: number;
  slug: string;
  sort_order: number;
  visible: boolean;
  [key: string]: FieldValue;
};

// Bilingual<"name"> contributes optional `name_tr` and `name_en` string fields,
// mirroring how the backend stores every translatable field.
export type Bilingual<Base extends string> = {
  [Key in `${Base}_tr` | `${Base}_en`]?: string;
};

export type Project = ContentItem &
  Bilingual<"name" | "description" | "role" | "problem" | "body" | "highlights" | "outcome"> & {
    tech_stack?: string[];
    domains?: string[];
    category?: string;
    employer?: string;
    year?: string;
    live_url?: string;
    github_url?: string;
    open_source?: boolean;
    featured?: boolean;
  };

export type Experience = ContentItem &
  Bilingual<"role" | "description"> & {
    company?: string;
    tech_stack?: string[];
    start_date?: string;
    end_date?: string;
  };

export type Education = ContentItem &
  Bilingual<"school" | "degree" | "detail"> & {
    start_date?: string;
    end_date?: string;
  };

export type Certification = ContentItem &
  Bilingual<"name"> & {
    issuer?: string;
    year?: string;
    attachment_url?: string;
  };

export type SkillGroup = ContentItem &
  Bilingual<"group"> & {
    items?: string[];
  };

export type Social = ContentItem &
  Bilingual<"label"> & {
    url: string;
  };

export type DocumentItem = ContentItem &
  Bilingual<"title" | "description"> & {
    category?: string;
    file_url?: string;
    year?: string;
  };

export type PortfolioData = {
  projects: Project[];
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: SkillGroup[];
  socials: Social[];
  documents: DocumentItem[];
  settings: Record<string, string>;
};
