export interface PresetAvatar {
  id: string;
  name: string;
  url: string;
  gender: 'male' | 'female';
}

export const DEFAULT_MALE_AVATAR = 'https://assets.watermelon.sh/wm_alex.png';
export const DEFAULT_FEMALE_AVATAR = 'https://assets.watermelon.sh/wm_olivia.png';

export const PRESET_AVATARS: PresetAvatar[] = [
  // Working Male Avatars
  { id: 'avatar-1', name: 'Alex', url: 'https://assets.watermelon.sh/wm_alex.png', gender: 'male' },
  { id: 'avatar-2', name: 'Josh', url: 'https://assets.watermelon.sh/wm_josh.png', gender: 'male' },

  // Working Female Avatars
  { id: 'avatar-3', name: 'Olivia', url: 'https://assets.watermelon.sh/wm_olivia.png', gender: 'female' },
  { id: 'avatar-4', name: 'Mia', url: 'https://assets.watermelon.sh/wm_mia.png', gender: 'female' },
];

export function getDefaultAvatarByGender(gender?: string): string {
  const normalized = gender?.toLowerCase().trim();
  if (normalized === 'female' || normalized === 'f') {
    return DEFAULT_FEMALE_AVATAR;
  }
  return DEFAULT_MALE_AVATAR;
}
