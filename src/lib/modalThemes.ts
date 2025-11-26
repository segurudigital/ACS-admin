// Global Modal Theme Configuration

export interface ModalTheme {
  background: string;
  textColor: string;
  messageColor: string;
  cancelButtonColor: string;
  removeBorder: boolean;
}

export const MODAL_THEMES = {
  default: {
    background: 'bg-white',
    textColor: 'text-gray-900',
    messageColor: 'text-gray-500',
    cancelButtonColor: 'text-gray-700 hover:text-gray-500',
    removeBorder: false,
  },
  orange: {
    background: 'bg-gradient-to-b from-[#F25F29] to-[#F23E16]',
    textColor: 'text-white',
    messageColor: 'text-orange-100',
    cancelButtonColor: 'text-white hover:text-orange-200',
    removeBorder: true,
  },
} as const;

export type ModalThemeName = keyof typeof MODAL_THEMES;

export function getModalTheme(themeName: ModalThemeName = 'default'): ModalTheme {
  return MODAL_THEMES[themeName];
}