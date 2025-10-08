# FormField (Molecule)

Combines label, input and validation message into a reusable form field.

- Type: Molecule
- Location: `src/molecules/form-field/FormField.tsx`

## Props
- `name: string` — field name for RHF
- `label: string` — rendered label
- `placeholder?: string`
- `type?: string` — HTML input type
- `control: Control` — react-hook-form control instance

## Usage
```tsx
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { FormField } from "@/molecules/form-field";

const { control } = useForm();
<Form>
  <form>
    <FormField name="title" label="Title" control={control} />
  </form>
  </Form>
```

### Updates
- v1.0.0 — Initial creation

