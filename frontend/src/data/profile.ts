export const profile = {
  name: 'Aman Saxena',
  initials: 'AS',
  tagline: 'Full Stack & GenAI Engineer',
  location: 'Noida, India',
  links: [
    { label: 'GitHub', href: 'https://github.com/Amansaxena16', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aman-saxena-16nov/', icon: 'linkedin' },
    { label: 'LeetCode', href: 'https://leetcode.com/u/Amansaxena16/', icon: 'code' },
    { label: 'Email', href: 'mailto:aman16nov.as@gmail.com', icon: 'mail' },
  ],
} as const

export type ProfileLink = (typeof profile.links)[number]
