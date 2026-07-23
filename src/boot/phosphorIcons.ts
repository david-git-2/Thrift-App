import { boot } from 'quasar/wrappers';
import { IconSet } from 'quasar';

export default boot(() => {
  IconSet.iconMapFn = (iconName: string) => {
    // Phosphor regular weight uses `.ph`, not `.ph-regular`
    if (typeof iconName === 'string' && iconName.startsWith('ph')) {
      return {
        cls: iconName.replace(/\bph-regular\b/g, 'ph')
      };
    }
  };
});
