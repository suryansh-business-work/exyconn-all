import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Flex,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Skeleton,
} from '@exyconn/shell/components/ui';
import {
  EditorMode,
  useListCampaignTemplatesQuery,
  useTechEmailTemplateOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import { asDesign, type Design } from './blocks';

/** What choosing a template gives the email. */
export interface PickedTemplate {
  editorMode: EditorMode;
  design: Design | null;
  mjml: string;
}

interface TemplatePickerProps {
  onPick: (template: PickedTemplate) => void;
}

/** Templates grouped by category, then the Tech > Email templates as plain MJML. */
export function TemplatePicker({ onPick }: Readonly<TemplatePickerProps>) {
  const t = useT();
  const saved = useListCampaignTemplatesQuery({ fetchPolicy: 'cache-and-network' });
  const tech = useTechEmailTemplateOptionsQuery();
  if (saved.loading && !saved.data) {
    return <Skeleton variant="rounded" height={200} />;
  }
  const templates = saved.data?.listCampaignTemplates ?? [];
  const categories = [...new Set(templates.map((template) => template.category))];
  const techTemplates = tech.data?.techEmailTemplateOptions ?? [];
  return (
    <Flex direction="column" spacing={1}>
      <Alert severity="info">
        {t('The email gets its own copy. Editing it never changes the template.')}
      </Alert>
      {(saved.error ?? tech.error) && (
        <Alert severity="error">{(saved.error ?? tech.error)?.message}</Alert>
      )}
      <List dense>
        {categories.map((category) => (
          <li key={category}>
            <List dense subheader={<ListSubheader>{category}</ListSubheader>}>
              {templates
                .filter((template) => template.category === category)
                .map((template) => (
                  <ListItem
                    key={template.id}
                    secondaryAction={
                      <Button
                        size="small"
                        onClick={() =>
                          onPick({
                            editorMode: template.editorMode,
                            design: asDesign(template.blocks),
                            mjml: template.mjml,
                          })
                        }
                      >
                        {t('Use')}
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={template.name}
                      secondary={
                        template.description ||
                        t('Version {version}', { version: template.version })
                      }
                    />
                  </ListItem>
                ))}
            </List>
          </li>
        ))}
        {techTemplates.length > 0 && (
          <li>
            <List dense subheader={<ListSubheader>{t('From Tech > Email')}</ListSubheader>}>
              {techTemplates.map((template) => (
                <ListItem
                  key={template.key}
                  secondaryAction={
                    <Button
                      size="small"
                      onClick={() =>
                        onPick({ editorMode: EditorMode.Code, design: null, mjml: template.mjml })
                      }
                    >
                      {t('Use')}
                    </Button>
                  }
                >
                  <ListItemText primary={template.name} secondary={template.key} />
                </ListItem>
              ))}
            </List>
          </li>
        )}
      </List>
      {templates.length === 0 && techTemplates.length === 0 && (
        <Alert severity="info">
          {t('No templates yet. Save a design as a template to reuse it.')}
        </Alert>
      )}
    </Flex>
  );
}
