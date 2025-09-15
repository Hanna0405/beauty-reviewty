import { SERVICE_GROUPS } from './services';
import { LANGUAGES } from './languages';

export const SERVICES_OPTIONS = SERVICE_GROUPS.flatMap(group => 
 group.children.map(service => ({
   value: service.value,
   label: service.label,
   emoji: group.icon
 }))
);

export const LANGUAGE_OPTIONS = LANGUAGES.map(lang => ({
 value: lang.value,
 label: lang.label,
 emoji: lang.label.split(' ')[0] // Extract emoji from label like "🇬🇧 English"
}));