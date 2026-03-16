export interface Module {
  id:       string;
  icon:     string;
  titleKey: string;
  descKey:  string;
  /** i18n key that resolves to the URL slug for the current language */
  pathKey:  string;
  /** All language variants — used to register every route in the router */
  paths:    string[];
  accent:   string;
  tagKeys:  string[];
}

export const MODULES: Module[] = [
  {
    id:       'wealthplanner',
    icon:     '🏑',
    titleKey: 'wealthPlanner.title',
    descKey:  'wealthPlanner.cardDesc',
    pathKey:  'routes.wealthPlanner',
    paths:    ['/wealthplanner', '/vermogenplanner'],
    accent:   '#4ade80',
    tagKeys:  ['common.tags.finance', 'common.tags.planning'],
  },
];
