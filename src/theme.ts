import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontSmoothing: true,
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
    Card: {
      defaultProps: { radius: 'md', withBorder: true, shadow: 'sm', padding: 'md' },
    },
    Paper: {
      defaultProps: { radius: 'md', withBorder: true },
    },
  },
});

