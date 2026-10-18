export type Language = 'uk' | 'en'

export type Platform =
  | 'github'
  | 'gitlab'
  | 'linkedin'
  | 'telegram'
  | 'x'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'dribbble'
  | 'behance'
  | 'medium'
  | 'devto'
  | 'stackoverflow'
  | 'leetcode'
  | 'discord'
  | 'email'
  | 'website'
  | 'other'

export interface Stat {
  value: string
  label: string
}

export interface SocialLink {
  platform: Platform
  url: string
  label: string
}

export interface Profile {
  full_name: string
  brand: string
  headline: string
  roles: string[]
  tagline: string
  about: string
  avatar: string | null
  location: string
  timezone: string
  email: string
  phone: string
  is_available: boolean
  availability_text: string
  resume: string | null
  contact_text: string
  footer_text: string
  language: Language
  seo_title: string
  seo_description: string
  stats: Stat[]
  socials: SocialLink[]
}

export type ServiceIcon =
  | 'code'
  | 'layout'
  | 'server'
  | 'database'
  | 'smartphone'
  | 'cloud'
  | 'bot'
  | 'palette'
  | 'shield'
  | 'cpu'
  | 'rocket'
  | 'sparkles'

export interface Service {
  id: number
  title: string
  description: string
  icon: ServiceIcon
}

export type SkillLevel = 1 | 2 | 3 | 4 | 5

export interface Skill {
  id: number
  name: string
  level: SkillLevel
}

export interface SkillCategory {
  id: number
  name: string
  description: string
  skills: Skill[]
}

export type ExperienceKind = 'work' | 'freelance' | 'education' | 'volunteer'

export interface Experience {
  id: number
  kind: ExperienceKind
  title: string
  organization: string
  organization_url: string
  logo: string | null
  location: string
  employment_type: string
  start_date: string
  end_date: string | null
  description: string
  achievements: string[]
  technologies: string[]
}

export interface ProjectCategory {
  id: number
  name: string
  slug: string
}

export type ProjectStatus = 'live' | 'in_progress' | 'completed' | 'archived'

export interface ProjectImage {
  id: number
  image: string
  caption: string
}

export interface Project {
  id: number
  slug: string
  title: string
  category: string | null
  summary: string
  description: string
  highlights: string[]
  cover: string | null
  images: ProjectImage[]
  role: string
  year: number | null
  status: ProjectStatus
  live_url: string
  repo_url: string
  technologies: string[]
  accent_color: string
  is_featured: boolean
}

export interface Certificate {
  id: number
  title: string
  issuer: string
  issued_at: string | null
  credential_url: string
  image: string | null
}

export interface Testimonial {
  id: number
  author: string
  role: string
  company: string
  avatar: string | null
  text: string
  url: string
}

export interface Portfolio {
  profile: Profile | null
  services: Service[]
  skill_categories: SkillCategory[]
  featured_skills: string[]
  experience: Experience[]
  project_categories: ProjectCategory[]
  projects: Project[]
  certificates: Certificate[]
  testimonials: Testimonial[]
}

export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
  website: string
}

export type ContactErrors = Partial<Record<keyof ContactPayload | 'detail', string[]>>
