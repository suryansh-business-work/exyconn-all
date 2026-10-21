import { RhfFreeSoloField } from '@exyconn/shell/components/form/rhf';
import { MaModelPurpose, useMaAvailableModelsQuery } from '@exyconn/shell/graphql/generated';

interface ModelFieldProps {
  name: 'analysisModel' | 'transcriptionModel';
  label: string;
  helperText: string;
  purpose: MaModelPurpose;
}

/**
 * A model picker: the models the platform's OpenAI key can use for this purpose, read from
 * the server, and any other name typed in by hand.
 */
function ModelField({ name, label, helperText, purpose }: Readonly<ModelFieldProps>) {
  const { data, loading, error } = useMaAvailableModelsQuery({ variables: { purpose } });
  return (
    <RhfFreeSoloField
      name={name}
      label={label}
      helperText={helperText}
      options={data?.maAvailableModels ?? []}
      loading={loading}
      optionsError={error?.message}
    />
  );
}

/** The two models the assistant runs on: one writes the notes, one transcribes the audio. */
export function ModelFields() {
  return (
    <>
      <ModelField
        name="analysisModel"
        label="Analysis model"
        purpose={MaModelPurpose.Analysis}
        helperText="The AI model that writes the notes and action items. Pick one or type its name."
      />
      <ModelField
        name="transcriptionModel"
        label="Transcription model"
        purpose={MaModelPurpose.Transcription}
        helperText="The AI model that turns call audio into text. Pick one or type its name."
      />
    </>
  );
}
